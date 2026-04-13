import { describe, it, expect, beforeAll } from 'vitest';

const BASE = 'http://localhost:4000/api';

let agentToken = '';
let ticketTypeId = '';

describe('Sales', () => {
  beforeAll(async () => {
    // Login as agent
    const res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId: 'A001', pin: '1234' }),
    });
    const data = await res.json();
    agentToken = data.accessToken;

    // Get ticket types
    const typesRes = await fetch(`${BASE}/tickets/types`, {
      headers: { Authorization: `Bearer ${agentToken}` },
    });
    const types = await typesRes.json();
    ticketTypeId = types[0].id;
  });

  it('should create a sale', async () => {
    const res = await fetch(`${BASE}/sales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${agentToken}`,
      },
      body: JSON.stringify({
        ticketTypeId,
        quantity: 2,
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        customerEmailConfirm: 'test@example.com',
        paymentMethod: 'CASH',
      }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.quantity).toBe(2);
    expect(data.tickets).toHaveLength(2);
    expect(data.status).toBe('COMPLETED');
    expect(data.commissionAmount).toBeGreaterThan(0);
  });

  it('should reject mismatched emails', async () => {
    const res = await fetch(`${BASE}/sales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${agentToken}`,
      },
      body: JSON.stringify({
        ticketTypeId,
        quantity: 1,
        customerName: 'Test',
        customerEmail: 'test@example.com',
        customerEmailConfirm: 'different@example.com',
        paymentMethod: 'CASH',
      }),
    });

    expect(res.status).toBe(400);
  });

  it('should list agent sales for today', async () => {
    const res = await fetch(`${BASE}/sales/my/today`, {
      headers: { Authorization: `Bearer ${agentToken}` },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.summary).toBeDefined();
    expect(data.summary.totalSales).toBeGreaterThan(0);
  });

  it('should require authentication', async () => {
    const res = await fetch(`${BASE}/sales`);
    expect(res.status).toBe(401);
  });
});
