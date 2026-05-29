import { MercadoPagoConfig, Payment } from 'mercadopago';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get("action") || url.searchParams.get("topic");
    const id = url.searchParams.get("data.id") || url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
      console.error("MERCADOPAGO_ACCESS_TOKEN is missing");
      return NextResponse.json({ error: "Config error" }, { status: 500 });
    }

    // We only care about payment updates/creations
    if (action === "payment.created" || action === "payment.updated" || request.url.includes("topic=payment")) {
      const client = new MercadoPagoConfig({ accessToken });
      const paymentClient = new Payment(client);
      
      // Fetch the actual payment status from MercadoPago securely
      const paymentInfo = await paymentClient.get({ id });
      
      const status = paymentInfo.status;
      const externalReference = paymentInfo.external_reference; // This is our user_id!

      if (status === 'approved' && externalReference) {
        // Upgrade user to premium
        // We MUST use the service role key here because the webhook doesn't have the user's JWT
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const { error: updateError } = await supabaseAdmin
          .from('user_usage')
          .update({ 
            plan: 'premium',
            questions_count: 0 
          })
          .eq('user_id', externalReference);

        if (updateError) {
          console.error("Erro ao atualizar plano no Supabase:", updateError);
          return NextResponse.json({ error: "DB Update Failed" }, { status: 500 });
        }
        console.log(`Usuário ${externalReference} atualizado para Premium com sucesso!`);
      }
    } else if (action === "subscription_preapproval.created" || action === "subscription_preapproval.updated" || request.url.includes("topic=subscription_preapproval")) {
      // Import PreApproval dynamically to avoid top-level issues if SDK is old (though it is v3)
      const { PreApproval } = require('mercadopago');
      const client = new MercadoPagoConfig({ accessToken });
      const preApprovalClient = new PreApproval(client);
      
      const subInfo = await preApprovalClient.get({ id });
      const status = subInfo.status; // 'authorized', 'paused', 'cancelled'
      const payerEmail = subInfo.payer_email;

      if (payerEmail) {
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Fetch user by email
        const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
        if (authError) throw authError;

        const user = users.find(u => u.email === payerEmail);
        
        if (user) {
          if (status === 'authorized') {
            const assignedPlan = subInfo.preapproval_plan_id === 'c45e35a99a5b46e18f3dc970c9d266ff' ? 'ultra' : 'premium';
            await supabaseAdmin.from('user_usage').update({ 
              plan: assignedPlan, 
              subscription_id: id,
              subscription_status: status 
            }).eq('user_id', user.id);
            console.log(`Assinatura ativa (${assignedPlan}) para ${payerEmail}`);
          } else if (status === 'cancelled') {
            await supabaseAdmin.from('user_usage').update({ 
              plan: 'free', 
              subscription_id: null,
              subscription_status: status 
            }).eq('user_id', user.id);
            console.log(`Assinatura cancelada para ${payerEmail}`);
          }
        } else {
          console.error(`Usuário com e-mail ${payerEmail} não encontrado na base para vincular assinatura.`);
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
