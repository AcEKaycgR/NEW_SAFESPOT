import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function initializeTestUser() {
  try {
    console.log('Checking if test user exists...');
    
    const existingUser = await prisma.user.findUnique({
      where: { id: 123 }
    });

    if (existingUser) {
      console.log('Test user already exists:', existingUser);
      return existingUser;
    }

    console.log('Creating test user...');
    const user = await prisma.user.create({
      data: {
        id: 123,
        email: 'test@example.com',
        name: 'TestUser',
        verification_status: 'VERIFIED'
      }
    });

    console.log('Test user created:', user);
    return user;
  } catch (error) {
    console.error('Error initializing test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

initializeTestUser();
