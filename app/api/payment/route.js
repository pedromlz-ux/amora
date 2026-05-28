import { MercadoPagoConfig, Payment } from 'mercadopago';
import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const body = await request.json();
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    
    // Auth Validation
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Sessão inválida.' }, { status: 401 });
    }

    if (!accessToken) {
      console.error('MERCADOPAGO_ACCESS_TOKEN is missing');
      return NextResponse.json(
        { error: 'Configuração de pagamento incompleta no servidor.' },
        { status: 500 }
      );
    }

    const client = new MercadoPagoConfig({ accessToken });
    const payment = new Payment(client);

    // Using localhost for testing if Vercel URL is not available. 
    // Usually you need ngrok or localtunnel to test webhooks locally.
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://YOUR_NGROK_URL.ngrok-free.app';

    const paymentData = {
      body: {
        // Hardcoded price for security to prevent tampering
        transaction_amount: 19.90,
        token: body.token,
        description: body.description || "Amora Premium",
        installments: body.installments,
        payment_method_id: body.payment_method_id,
        issuer_id: body.issuer_id,
        external_reference: user.id, // VINCULAR PAGAMENTO AO USUÁRIO
        notification_url: `${baseUrl}/api/webhooks/mercadopago`, // ROTA DO WEBHOOK
        payer: {
          email: body.payer.email,
          ...(body.payer.identification && {
            identification: {
              type: body.payer.identification.type,
              number: body.payer.identification.number
            }
          })
        }
      }
    };

    const result = await payment.create(paymentData);
    
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: 'Erro ao processar pagamento.' },
      { status: 500 }
    );
  }
}
