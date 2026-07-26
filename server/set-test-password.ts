import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const email = 'drmood1998@gmail.com';
const password = 'ChangeMoi123!';

(async () => {
  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.update({
    where: { email },
    data: { password: hash },
  });
  console.log('Updated user', user.email, user.role);
  await prisma.$disconnect();
})();
