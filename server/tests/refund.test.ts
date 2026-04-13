import { describe, it, expect, beforeAll } from 'vitest';

const BASE = 'http://localhost:4000/api';

let agentToken = '';
let ticketTypeId = '';

describe('Refunds', () => {
  beforeAll(async () => {
    const res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId: 'A001', pin: '1234' }),
    });
    const data = await res.json();
    agentToken = data.accessToken;

    const typesRes = await fetch(`${BASE}/tickets/types`, {
      headers: { Authorization: `Bearer ${agentToken}` },
    });
    const types = await typesRes.json();
    ticketTypeId = types[0].id;
  });

  it('should search for refundable sales', async () => {
    const res = await fetch(`${BASE}/refunds/search?q=demo`, {
      headers: { Authorization: `Bearer ${agentToken}` },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  it('should process a refund and void tickets', async () => {
    // Create a sale first
    const saleRes = await fetch(`${BASE}/sales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${agentToken}`,
      },
      body: JSON.stringify({
        ticketTypeId,
        quantity: 1,
        customerName: 'Refund Test',
        customerEmail: 'refund@example.com',
        customerEmailConfirm: 'refund@example.com',
        paymentMethod: 'CASH',
      }),
    });
    const sale = await saleRes.json();

    // Process refund
    const refundRes = await fetch(`${BASE}/refunds/${sale.id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${agentToken}` },
    });

    expect(refundRes.status).toBe(200);
    const refunded = await refundRes.json();
    expect(refunded.status).toBe('REFUNDED');

    // Verify tickets are voided
    const saleDetail = await fetch(`${BASE}/sales/${sale.id}`, {
      headers: { Authorization: `Bearer ${agentToken}` },
    });
    const detail = await saleDetail.json();
    expect(detail.tickets.every((t: { status: string }) => t.status === 'VOIDED')).toBe(true);
  });

  it('should reject double refund', async () => {
    // Create and refund a sale
    const saleRes = await fetch(`${BASE}/sales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${agentToken}`,
      },
      body: JSON.stringify({
        ticketTypeId,
        quantity: 1,
        customerName: 'Double Refund',
        customerEmail: 'double@example.com',
        customerEmailConfirm: 'double@example.com',
        paymentMethod: 'CASH',
      }),
    });
    const sale = await saleRes.json();

    await fetch(`${BASE}/refunds/${sale.id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${agentToken}` },
    });

    // Try again
    const res = await fetch(`${BASE}/refunds/${sale.id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${agentToken}` },
    });
    expect(res.status).toBe(400);
  });
});
