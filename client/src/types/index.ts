export type Role = 'ADMIN' | 'AGENT';
export type PaymentMethod = 'CLOVER' | 'CASH';
export type SaleStatus = 'COMPLETED' | 'REFUNDED';
export type TicketStatus = 'ACTIVE' | 'SCANNED' | 'VOIDED';

export interface User {
  id: string;
  agentId: string;
  name: string;
  role: Role;
  email: string | null;
  ticketAlloc: number;
}

export interface TicketType {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  price: number;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Sale {
  id: string;
  orderNumber: string;
  agentId: string;
  agent?: { agentId: string; name: string };
  ticketTypeId: string;
  ticketType?: TicketType;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  commissionRate: number;
  commissionAmount: number;
  customerName: string;
  customerEmail: string;
  paymentMethod: PaymentMethod;
  cloverPaymentId: string | null;
  status: SaleStatus;
  emailSent: boolean;
  refundedAt: string | null;
  createdAt: string;
  tickets?: Ticket[];
}

export interface Ticket {
  id: string;
  saleId: string;
  qrCode: string;
  ticketNumber: number;
  status: TicketStatus;
  scannedAt: string | null;
}

export interface Agent extends User {
  phone: string | null;
  active: boolean;
  todayStats?: {
    salesCount: number;
    ticketsSold: number;
    revenue: number;
    commission: number;
  };
}

export interface OverviewStats {
  revenue: number;
  commission: number;
  salesCount: number;
  ticketsSold: number;
  ticketsScanned: number;
  scanRate: number;
  inventory: {
    total: number;
    sold: number;
    remaining: number;
  };
  activeAgents: number;
}

export interface ScanResult {
  valid: boolean;
  reason?: 'not_found' | 'refunded' | 'already_scanned';
  ticket?: Ticket & { sale: Sale };
  customerName?: string;
  ticketType?: string;
  scannedAt?: string;
}

export interface TodaySummary {
  sales: Sale[];
  summary: {
    totalSales: number;
    totalRevenue: number;
    totalCommission: number;
    totalTickets: number;
  };
}
