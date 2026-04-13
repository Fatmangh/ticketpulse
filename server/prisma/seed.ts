import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clear existing data
  await prisma.auditLog.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.user.deleteMany();
  await prisma.ticketType.deleteMany();

  // Create admin
  const admin = await prisma.user.create({
    data: {
      agentId: 'ADMIN',
      name: 'Admin',
      pinHash: await bcrypt.hash('0000', 10),
      role: 'ADMIN',
      email: 'admin@ticketpulse.app',
      ticketAlloc: 9999,
    },
  });
  console.log('Created admin:', admin.agentId);

  // Create agents
  const agentPins = ['1234', '5678', '9012', '3456', '7890'];
  const agentNames = ['Sarah Johnson', 'Marcus Chen', 'Aisha Patel', 'James Wilson', 'Elena Rodriguez'];

  for (let i = 0; i < 5; i++) {
    const agent = await prisma.user.create({
      data: {
        agentId: `A00${i + 1}`,
        name: agentNames[i],
        pinHash: await bcrypt.hash(agentPins[i], 10),
        role: 'AGENT',
        email: `agent${i + 1}@ticketpulse.app`,
        ticketAlloc: 50,
      },
    });
    console.log('Created agent:', agent.agentId, '— PIN:', agentPins[i]);
  }

  // Create ticket types
  const ticketTypes = await Promise.all([
    prisma.ticketType.create({
      data: { name: 'General Admission', icon: '🎫', price: 35, description: 'Standard entry ticket', sortOrder: 0 },
    }),
    prisma.ticketType.create({
      data: { name: 'VIP Experience', icon: '⭐', price: 75, description: 'Priority access + perks', sortOrder: 1 },
    }),
    prisma.ticketType.create({
      data: { name: 'Group Pack (4)', icon: '👥', price: 120, description: '4 entries, 1 price', sortOrder: 2 },
    }),
    prisma.ticketType.create({
      data: { name: 'Premium Plus', icon: '💎', price: 95, description: 'All-inclusive package', sortOrder: 3 },
    }),
  ]);
  console.log('Created ticket types:', ticketTypes.map((t) => t.name).join(', '));

  // Create today's inventory
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  await prisma.inventory.create({
    data: { date: today, totalTickets: 500 },
  });
  console.log('Created inventory for today: 500 tickets');

  // Create some sample sales
  const agents = await prisma.user.findMany({ where: { role: 'AGENT' } });
  let saleCount = 0;

  for (const agent of agents.slice(0, 3)) {
    for (let j = 0; j < 3; j++) {
      const ticketType = ticketTypes[j % ticketTypes.length];
      const quantity = 1 + Math.floor(Math.random() * 4);
      const totalAmount = ticketType.price * quantity;
      const commissionAmount = totalAmount * 0.08;

      const sale = await prisma.sale.create({
        data: {
          agentId: agent.id,
          ticketTypeId: ticketType.id,
          quantity,
          unitPrice: ticketType.price,
          totalAmount,
          commissionRate: 0.08,
          commissionAmount,
          customerName: `Demo Customer ${saleCount + 1}`,
          customerEmail: `demo${saleCount + 1}@example.com`,
          paymentMethod: j % 2 === 0 ? 'CASH' : 'CLOVER',
          cloverPaymentId: j % 2 === 1 ? `sandbox_pay_demo_${saleCount}` : null,
          emailSent: true,
        },
      });

      // Create tickets for this sale
      for (let k = 1; k <= quantity; k++) {
        await prisma.ticket.create({
          data: {
            saleId: sale.id,
            qrCode: `TP-${sale.id}-${k}-demo${Math.random().toString(36).slice(2, 10)}`,
            ticketNumber: k,
          },
        });
      }

      saleCount++;
    }
  }
  console.log(`Created ${saleCount} sample sales with tickets`);

  console.log('Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
