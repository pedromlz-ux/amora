import { MercadoPagoConfig, Payment } from 'mercadopago';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    
    if (!accessToken) {
      console.error('MERCADOPAGO_ACCESS_TOKEN is missing');
      return NextResponse.json(
        { error: 'Configuração de pagamento incompleta no servidor.' },
        { status: 500 }
      );
    }

    const client = new MercadoPagoConfig({ accessToken });
    const payment = new Payment(client);

    const paymentData = {
      body: {
        transaction_amount: body.transaction_amount,
        token: body.token,
        description: body.description,
        installments: body.installments,
        payment_method_id: body.payment_method_id,
        issuer_id: body.issuer_id,
        payer: {
          email: body.payer.email,
          identification: {
            type: body.payer.identification.type,
            number: body.payer.identification.number
          }
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
