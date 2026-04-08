
import { PrismaClient } from '../src/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email    = process.env.ADMIN_EMAIL    || 'admin@egoxlove.com';
  const password = process.env.ADMIN_PASSWORD || 'ChangeMe123!';

  const hashed = await bcrypt.hash(password, 12);

  const admin = await prisma.admin.upsert({
    where:  { email },
    update: { password: hashed },
    create: { email, password: hashed },
  });

  console.log(`✓ Admin created/updated: ${admin.email}`);
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);
  console.log('\n⚠️  Change the password after first login!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
