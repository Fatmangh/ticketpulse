import type { Sale, Ticket, TicketType } from '@prisma/client';
import { env } from '../config/env.js';
import { generateQRCode } from './qr.service.js';
import { prisma } from '../config/db.js';

interface SaleWithTickets extends Sale {
  tickets: Ticket[];
}

export async function sendTicketEmail(
  sale: SaleWithTickets,
  tickets: Ticket[],
  ticketType: TicketType,
): Promise<void> {
  // Generate QR code data URLs
  const qrCodes = await Promise.all(
    tickets.map(async (ticket) => ({
      ticketNumber: ticket.ticketNumber,
      qrDataUrl: await generateQRCode(ticket.qrCode),
    })),
  );

  if (!env.SENDGRID_API_KEY) {
    console.log('[Email Sandbox] Would send ticket email to:', sale.customerEmail);
    console.log('[Email Sandbox] QR codes generated:', qrCodes.length);

    // Mark as sent even in sandbox mode
    await prisma.sale.update({
      where: { id: sale.id },
      data: { emailSent: true },
    });
    return;
  }

  // Build HTML email
  const ticketHtml = qrCodes
    .map(
      (qr) => `
      <div style="text-align:center;margin:20px 0;padding:20px;border:1px solid #eee;border-radius:8px;">
        <p style="font-family:'Outfit',sans-serif;font-size:14px;color:#666;">Ticket #${qr.ticketNumber}</p>
        <img src="${qr.qrDataUrl}" alt="QR Code" width="200" height="200" />
        <p style="font-family:'JetBrains Mono',monospace;font-size:12px;color:#999;">Present this ticket at entry</p>
      </div>
    `,
    )
    .join('');

  const html = `
    <div style="max-width:600px;margin:0 auto;font-family:'Outfit',Arial,sans-serif;">
      <div style="background:#1A1B1F;padding:24px;text-align:center;">
        <h1 style="color:#E8643A;margin:0;font-size:28px;">TicketPulse</h1>
      </div>
      <div style="padding:24px;">
        <h2 style="color:#1A1B1F;">Your Tickets</h2>
        <p>Hi ${sale.customerName},</p>
        <p>Thank you for your purchase! Here are your tickets:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px;border-bottom:1px solid #eee;"><strong>Event</strong></td><td style="padding:8px;border-bottom:1px solid #eee;">${ticketType.name}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;"><strong>Quantity</strong></td><td style="padding:8px;border-bottom:1px solid #eee;">${sale.quantity}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;"><strong>Order #</strong></td><td style="padding:8px;border-bottom:1px solid #eee;font-family:'JetBrains Mono',monospace;">${sale.orderNumber}</td></tr>
          <tr><td style="padding:8px;"><strong>Date</strong></td><td style="padding:8px;">${new Date(sale.createdAt).toLocaleDateString()}</td></tr>
        </table>
        ${ticketHtml}
        <p style="color:#666;font-size:13px;margin-top:24px;text-align:center;">Present this ticket at entry. Each QR code is valid for one entry only.</p>
      </div>
    </div>
  `;

  // Dynamic import for SendGrid (only when key is present)
  const sgMail = await import('@sendgrid/mail');
  sgMail.default.setApiKey(env.SENDGRID_API_KEY);

  await sgMail.default.send({
    to: sale.customerEmail,
    from: { email: env.SENDGRID_FROM_EMAIL, name: env.SENDGRID_FROM_NAME },
    subject: `Your TicketPulse Tickets — ${ticketType.name}`,
    html,
  });

  await prisma.sale.update({
    where: { id: sale.id },
    data: { emailSent: true },
  });
}
