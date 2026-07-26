import supertest from 'supertest';
import { createApp } from './src/app';

const app = createApp();
const request = supertest(app);
const loginEmail = 'drmood1998@gmail.com';
const loginPassword = 'ChangeMoi123!';

(async () => {
  const login = await request.post('/api/v1/auth/login').send({ email: loginEmail, password: loginPassword });
  console.log('LOGIN', login.status, JSON.stringify(login.body));
  if (login.status !== 200) {
    process.exit(1);
  }

  const token = login.body.data.accessToken;
  const products = await request.get('/api/v1/products').set('Authorization', `Bearer ${token}`).query({ search: '', limit: 20 });
  console.log('PRODUCTS', products.status, JSON.stringify(products.body));

  if (products.status !== 200) {
    process.exit(1);
  }

  const firstProduct = products.body.data[0] || products.body.data?.items?.[0];
  console.log('FIRST_PRODUCT', firstProduct);
  if (!firstProduct) {
    console.log('No product available, skipping sales test');
    process.exit(0);
  }

  const sale = await request
    .post('/api/v1/sales')
    .set('Authorization', `Bearer ${token}`)
    .send({
      paymentMethod: 'ESPECES',
      items: [{ productId: firstProduct.id, quantity: 1 }],
      discount: 0,
      montantRecu: Number(firstProduct.prixVente) + 1000,
    });
  console.log('SALES', sale.status, JSON.stringify(sale.body));
})();
