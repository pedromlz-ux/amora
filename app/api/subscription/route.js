import { NextResponse } from 'next/server';

export async function GET(request) {
  // O init_point retornado pela API do Mercado Pago para o plano "Amora Premium (Mensal)"
  // Este link de checkout leva para o fluxo de Assinaturas seguras do MP.
  const initPoint = "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=baaaf6620b4f42fb8847302ce0dc5cf2";
  
  return NextResponse.json({
    url: initPoint
  });
}
