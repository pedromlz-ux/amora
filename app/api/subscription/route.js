import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const plan = searchParams.get('plan') || 'premium';

  // O init_point retornado pela API do Mercado Pago para os planos Amora.
  // Ambos direcionam para o fluxo de Assinaturas seguras do MP.
  let initPoint = "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=baaaf6620b4f42fb8847302ce0dc5cf2";

  if (plan === 'ultra') {
    // Caso haja outro id de plano customizado para R$ 29,90, configuramos aqui.
    initPoint = "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=baaaf6620b4f42fb8847302ce0dc5cf2";
  }
  
  return NextResponse.json({
    url: initPoint
  });
}
