import { prisma } from './prisma';
import { integrationStatus } from './integrationConfig';
import { createShipment } from './shipping/quickshipper';
import { sendOrderConfirmationEmail, sendOrderShippedEmail } from './email';

export async function runOrderJobs(reference: string) {
  const order = await prisma.order.findUnique({ where: { reference }, include: { items: { include: { product: true } } } });
  if (!order || !['paid', 'shipped'].includes(order.status) || order.paymentProvider === 'sandbox') return;
  const jobs = await prisma.integrationJob.findMany({ where: { reference, status: 'pending' }, orderBy: { createdAt: 'asc' } });
  for (const job of jobs) {
    const claim = await prisma.integrationJob.updateMany({ where: { id: job.id, status: 'pending' }, data: { status: 'processing', attempts: { increment: 1 }, lastError: null } });
    if (!claim.count) continue;
    const config = integrationStatus();
    if (job.kind === 'shipment' ? config.shipping !== 'live' || !config.quickshipper || !config.pickup : !config.email) {
      await prisma.integrationJob.update({ where: { id: job.id }, data: { status: 'blocked', lastError: 'Integration configuration incomplete or disabled' } });
      continue;
    }
    try {
      if (job.kind === 'shipment') {
        if (!order.shipmentId) {
          const shipment = await createShipment({ reference, recipientName: order.customerName, phone: order.phone, city: order.city, address: order.address, latitude: order.latitude, longitude: order.longitude, note: order.note, declaredValue: order.total, weightGrams: order.items.reduce((sum, item) => sum + item.product.weight * item.quantity, 0) });
          await prisma.order.update({ where: { reference }, data: { shipmentId: shipment.shipmentId, trackingCode: shipment.trackingCode } });
          order.trackingCode = shipment.trackingCode;
        }
      } else if (job.kind === 'confirmation' || job.kind === 'shipped-email') {
        const send = job.kind === 'confirmation' ? sendOrderConfirmationEmail : sendOrderShippedEmail;
        await send(order, order.locale);
      } else throw new Error('Unknown integration job');
      await prisma.integrationJob.update({ where: { id: job.id }, data: { status: 'succeeded', lastError: null } });
    } catch {
      await prisma.integrationJob.update({ where: { id: job.id }, data: { status: 'review', lastError: job.kind === 'shipment' ? 'Check the courier dashboard before retrying: the shipment may already exist.' : 'Delivery unconfirmed. Check email logs before retrying.' } });
    }
  }
}

/** Admin explicitly confirms external reconciliation before retrying ambiguous work. */
export async function retryIntegrationJob(id: string, reconciled: boolean) {
  const job = await prisma.integrationJob.findUnique({ where: { id } });
  if (!job || job.status === 'succeeded') return;
  if (job.status === 'processing' && Date.now() - job.updatedAt.getTime() < 10 * 60_000) throw new Error('Job is still running');
  if (['review', 'processing'].includes(job.status) && !reconciled) throw new Error('Reconcile with the provider first');
  const claim = await prisma.integrationJob.updateMany({ where: { id, status: job.status, updatedAt: job.updatedAt }, data: { status: 'pending' } });
  if (claim.count) await runOrderJobs(job.reference);
}
