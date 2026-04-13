import { env } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';

export async function processCloverPayment(amount: number, description: string): Promise<string> {
  if (env.CLOVER_SANDBOX) {
    console.log(`[Clover Sandbox] Payment: $${amount.toFixed(2)} — ${description}`);
    return `sandbox_pay_${Date.now()}`;
  }

  if (!env.CLOVER_MERCHANT_ID || !env.CLOVER_API_TOKEN) {
    throw new AppError(500, 'Clover credentials not configured');
  }

  const baseUrl = env.CLOVER_BASE_URL;
  const mId = env.CLOVER_MERCHANT_ID;
  const amountInCents = Math.round(amount * 100);

  // Create order
  const orderRes = await fetch(`${baseUrl}/v3/merchants/${mId}/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.CLOVER_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ total: amountInCents }),
  });

  if (!orderRes.ok) {
    throw new AppError(502, 'Clover order creation failed');
  }

  const order = await orderRes.json() as { id: string };

  // The actual card payment is handled by the Clover POS device.
  // This records the payment on the order.
  const paymentRes = await fetch(`${baseUrl}/v3/merchants/${mId}/orders/${order.id}/payments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.CLOVER_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount: amountInCents }),
  });

  if (!paymentRes.ok) {
    throw new AppError(502, 'Clover payment recording failed');
  }

  const payment = await paymentRes.json() as { id: string };
  return payment.id;
}

export async function processCloverRefund(paymentId: string, amount: number): Promise<void> {
  if (env.CLOVER_SANDBOX) {
    console.log(`[Clover Sandbox] Refund: $${amount.toFixed(2)} — payment ${paymentId}`);
    return;
  }

  if (!env.CLOVER_MERCHANT_ID || !env.CLOVER_API_TOKEN) {
    throw new AppError(500, 'Clover credentials not configured');
  }

  const baseUrl = env.CLOVER_BASE_URL;
  const mId = env.CLOVER_MERCHANT_ID;
  const amountInCents = Math.round(amount * 100);

  const res = await fetch(`${baseUrl}/v3/merchants/${mId}/refunds`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.CLOVER_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      payment: { id: paymentId },
      amount: amountInCents,
    }),
  });

  if (!res.ok) {
    console.error('Clover refund failed:', await res.text());
    throw new AppError(502, 'Clover refund failed');
  }
}
