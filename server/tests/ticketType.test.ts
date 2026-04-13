import { describe, it, expect, beforeAll } from 'vitest';

const BASE = 'http://localhost:4000/api';

let adminToken = '';
let agentToken = '';
let createdTypeId = '';

describe('Ticket Types', () => {
  beforeAll(async () => {
    const adminRes = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId: 'ADMIN', pin: '0000' }),
    });
    adminToken = (await adminRes.json()).accessToken;

    const agentRes = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId: 'A001', pin: '1234' }),
    });
    agentToken = (await agentRes.json()).accessToken;
  });

  it('should create a ticket type (admin)', async () => {
    const res = await fetch(`${BASE}/ticket-types`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ name: 'Test Event', price: 49.99, description: 'A test ticket', icon: '🎪' }),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.name).toBe('Test Event');
    expect(data.price).toBe(49.99);
    expect(data.icon).toBe('🎪');
    expect(data.active).toBe(true);
    createdTypeId = data.id;
  });

  it('should reject creation without name', async () => {
    const res = await fetch(`${BASE}/ticket-types`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ price: 10 }),
    });
    expect(res.status).toBe(400);
  });

  it('should reject creation with negative price', async () => {
    const res = await fetch(`${BASE}/ticket-types`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ name: 'Bad Price', price: -5 }),
    });
    expect(res.status).toBe(400);
  });

  it('should update a ticket type', async () => {
    const res = await fetch(`${BASE}/ticket-types/${createdTypeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ price: 59.99, description: 'Updated description' }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.price).toBe(59.99);
    expect(data.description).toBe('Updated description');
  });

  it('should toggle ticket type status', async () => {
    const res = await fetch(`${BASE}/ticket-types/${createdTypeId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ active: false }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.active).toBe(false);
  });

  it('agent GET should only return active types', async () => {
    const res = await fetch(`${BASE}/ticket-types`, {
      headers: { Authorization: `Bearer ${agentToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    // The deactivated type should not appear
    expect(data.find((t: { id: string }) => t.id === createdTypeId)).toBeUndefined();
  });

  it('admin GET should return all types', async () => {
    const res = await fetch(`${BASE}/ticket-types`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    // The deactivated type should appear for admin
    expect(data.find((t: { id: string }) => t.id === createdTypeId)).toBeDefined();
  });

  it('should delete a ticket type without sales', async () => {
    const res = await fetch(`${BASE}/ticket-types/${createdTypeId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.deleted).toBe(true);
  });

  it('should reject deleting a ticket type with sales', async () => {
    // Get a type that has sales from seed data
    const listRes = await fetch(`${BASE}/ticket-types`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const types = await listRes.json();
    const typeWithSales = types[0]; // Seed data created sales for first types

    const res = await fetch(`${BASE}/ticket-types/${typeWithSales.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Cannot delete');
  });

  it('should reject agent creating ticket types', async () => {
    const res = await fetch(`${BASE}/ticket-types`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${agentToken}` },
      body: JSON.stringify({ name: 'Agent Type', price: 10 }),
    });
    expect(res.status).toBe(403);
  });
});
