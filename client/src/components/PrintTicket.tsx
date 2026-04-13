import type { Sale, Ticket } from '../types';

interface PrintTicketProps {
  sale: Sale;
  tickets: Ticket[];
}

export function PrintTicket({ sale, tickets }: PrintTicketProps) {
  return (
    <div className="print-only p-4 font-display">
      <div className="text-center mb-4">
        <h1 className="text-xl font-bold">TicketPulse</h1>
        <p className="text-sm text-gray-500">Ticket Receipt</p>
      </div>

      <div className="border-t border-b border-gray-300 py-2 mb-2 text-sm space-y-1">
        <div className="flex justify-between">
          <span>Order #:</span>
          <span className="font-mono">{sale.orderNumber.slice(0, 12)}</span>
        </div>
        <div className="flex justify-between">
          <span>Type:</span>
          <span>{sale.ticketType?.name}</span>
        </div>
        <div className="flex justify-between">
          <span>Qty:</span>
          <span>{sale.quantity}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>Total:</span>
          <span>${sale.totalAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Customer:</span>
          <span>{sale.customerName}</span>
        </div>
        <div className="flex justify-between">
          <span>Date:</span>
          <span>{new Date(sale.createdAt).toLocaleString()}</span>
        </div>
      </div>

      <div className="text-center text-xs text-gray-500 space-y-1">
        <p>{tickets.length} ticket(s) — QR codes sent via email</p>
        <p>Present QR code at entry for admission</p>
        <p className="mt-2">Thank you for your purchase!</p>
      </div>
    </div>
  );
}
