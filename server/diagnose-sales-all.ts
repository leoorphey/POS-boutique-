import supertest from 'supertest';
import { createApp } from './src/app';

const app = createApp();
const request = supertest(app);
const loginEmail = 'drmood1998@gmail.com';
const loginPassword = 'ChangeMoi123!';

async function run() {
  const login = await request.post('/api/v1/auth/login').send({ email: loginEmail, password: loginPassword });
  console.log('LOGIN', login.status, JSON.stringify(login.body));
  if (login.status !== 200) process.exit(1);

  const token = login.body.data.accessToken;
  const products = await request.get('/api/v1/products').set('Authorization', `Bearer ${token}`).query({ search: '', limit: 20 });
  console.log('PRODUCTS', products.status, JSON.stringify(products.body));
  const firstProduct = products.body.data[0] || products.body.data?.items?.[0];
  if (!firstProduct) {
    console.log('No product available');
    process.exit(0);
  }

  const tests = [
    {
      name: 'ESPECES',
      body: { paymentMethod: 'ESPECES', items: [{ productId: firstProduct.id, quantity: 1 }], discount: 0, montantRecu: Number(firstProduct.prixVente) + 1000 },
    },
    {
      name: 'NEGOCIE_ESPECES',
      body: { paymentMethod: 'NEGOCIE', items: [{ productId: firstProduct.id, quantity: 1 }], discount: 0, prixNegocie: Number(firstProduct.prixVente) - 10000, montantRecu: Number(firstProduct.prixVente) - 9000, negotiatedPaymentMethod: 'ESPECES' },
    },
    {
      name: 'NEGOCIE_PAYDUNYA',
      body: { paymentMethod: 'NEGOCIE', items: [{ productId: firstProduct.id, quantity: 1 }], discount: 0, prixNegocie: Number(firstProduct.prixVente) - 10000, negotiatedPaymentMethod: 'PAYDUNYA' },
    },
    {
      name: 'PAYDUNYA',
      body: { paymentMethod: 'PAYDUNYA', items: [{ productId: firstProduct.id, quantity: 1 }], discount: 0 },
    },
  ];

  for (const test of tests) {
    const res = await request.post('/api/v1/sales').set('Authorization', `Bearer ${token}`).send(test.body);
    console.log(test.name, res.status, JSON.stringify(res.body));
  }
}

run().catch((err) => { console.error(err); process.exit(1); });
