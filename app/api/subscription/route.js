import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const plan = searchParams.get('plan') || 'premium';

  // O init_point retornado pela API do Mercado Pago para os planos Amora.
  // Ambos direcionam para o fluxo de Assinaturas seguras do MP.
  let initPoint = "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=baaaf6620b4f42fb8847302ce0dc5cf2";

  if (plan === 'ultra') {
    // Plano Amora Ultra (Mensal) - R$ 29,90 criado via API do Mercado Pago
    initPoint = "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=c45e35a99a5b46e18f3dc970c9d266ff";
  }
  
  return NextResponse.json({
    url: initPoint
  });
}
