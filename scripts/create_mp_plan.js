const https = require('https');

require('dotenv').config({ path: '.env.local' });

const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
if (!token) throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado.');

async function createPlan() {
  console.log("Creating Amora Ultra (Mensal) plan on Mercado Pago...");
  
  const body = JSON.stringify({
    reason: "Amora Ultra (Mensal)",
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: 29.90,
      currency_id: "BRL"
    },
    back_url: "https://amora.hublumi.com/configuracao"
  });

  const options = {
    hostname: 'api.mercadopago.com',
    port: 443,
    path: '/preapproval_plan',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Content-Length': body.length
    }
  };

  const req = https.request(options, (res) => {
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
      try {
        const data = JSON.parse(rawData);
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log("\nPlan Created Successfully!");
          console.log("Plan ID:", data.id);
          console.log("Checkout URL (init_point):", data.init_point);
        } else {
          console.error("Error response from Mercado Pago:", data);
        }
      } catch (e) {
        console.error("Parse error:", e);
      }
    });
  });

  req.on('error', (e) => {
    console.error("Request error:", e);
  });

  req.write(body);
  req.end();
}

createPlan();
