import 'dotenv/config';
import { PrismaClient } from './node_modules/@prisma/client/index.js';
const prisma = new PrismaClient();
const users = await prisma.user.findMany({ select: { id: true, email: true, name: true, role: true } });
console.log('Users in DB:');
console.table(users);
await prisma.$disconnect();
