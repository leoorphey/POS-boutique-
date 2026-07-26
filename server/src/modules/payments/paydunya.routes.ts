import { Router, Request, Response } from 'express';
import { verifyHash, confirmInvoice } from '../../services/paydunya.client';
import { prisma } from '../../config/prisma';
import { paymentsService } from './payments.service';

const router = Router();

// IPN: application/x-www-form-urlencoded, body contains `data` node
router.post('/ipn', async (req: Request, res: Response) => {
  try {

     console.log('========== IPN PAYDUNYA RECU ==========');
    console.log('BODY COMPLET :', req.body);

    const rawData = req.body;

    console.info('[PayDunya] IPN received', { body: rawData });

    const dataNode = rawData.data || {};

    const hash = dataNode.hash || rawData.hash || rawData.signature || '';

    console.log('HASH RECU :', hash);
    console.log('DATA NODE :', dataNode);

    //const rawData = req.body;
    console.info('[PayDunya] IPN received', { body: rawData });
    // PayDunya sends fields like: data[token]=..., data[status]=..., hash=...
    //const hash = rawData.hash || rawData.signature || '';
   // const dataNode = rawData.data || {};
    console.log('HASH RECU:', hash);
    console.log('BODY:', req.body);
    if (!verifyHash(hash)) {
      console.warn('PayDunya IPN: invalid hash');
      return res.status(400).send('invalid hash');
    }

    const token =
  dataNode.invoice?.token ||
  dataNode.token ||
  dataNode.invoice_token ||
  rawData.token;
    if (!token) {
      console.warn('PayDunya IPN: missing token');
      return res.status(400).send('missing token');
    }

    // Toujours confirmer auprès de PayDunya
    const confirm = await confirmInvoice(token);
    const responsePayload = (confirm as any)?.response ?? (confirm as any)?.raw ?? {};
    const status = confirm?.state || responsePayload?.status || responsePayload?.state || dataNode.status;

    // Trouver la vente liée au token (indexée par paydunyaReference ou token selon implémentation)
    const sale = await prisma.sale.findFirst({ where: { paydunyaReference: token } });
    console.log('TOKEN RECU:', token);
    if (!sale) {
      console.warn('PayDunya IPN: sale not found for token', token);
      return res.status(404).send('sale not found');
    }

    if (status === 'PAID' || status === 'paid' || status === 'COMPLETED'|| status === 'completed') {
      try {
        await paymentsService.confirmPaydunyaPayment(token, 'paid');
      } catch (err) {
        console.error('Error confirming PayDunya payment:', err);
        // continue: respond 200 to avoid retries if we already handled it
      }
    }

    return res.status(200).send('ok');
  } catch (err) {
    console.error('PayDunya IPN error', err);
    return res.status(500).send('error');
  }
});

export default router;
