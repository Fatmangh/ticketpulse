import { describe, it, expect, beforeAll } from 'vitest';

const BASE = 'http://localhost:4000/api';

describe('Auth', () => {
  it('should login with valid agent credentials', async () => {
    const res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId: 'A001', pin: '1234' }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.accessToken).toBeDefined();
    expect(data.refreshToken).toBeDefined();
    expect(data.user.agentId).toBe('A001');
    expect(data.user.role).toBe('AGENT');
  });

  it('should login as admin', async () => {
    const res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId: 'ADMIN', pin: '0000' }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user.role).toBe('ADMIN');
  });

  it('should reject invalid credentials', async () => {
    const res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId: 'A001', pin: '0000' }),
    });

    expect(res.status).toBe(401);
  });

  it('should refresh access token', async () => {
    const loginRes = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId: 'A001', pin: '1234' }),
    });
    const { refreshToken } = await loginRes.json();

    const res = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.accessToken).toBeDefined();
  });
});
