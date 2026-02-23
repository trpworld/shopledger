import { verifySystemIntegrity } from './lib/analytics'
import { runSystemDiagnostics } from './app/actions/health'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function testHealth() {
    // 1. Mocking a session since runSystemDiagnostics checks for OWNER role
    // We bypass the session check for this script by importing the functions directly, 
    // but runSystemDiagnostics DOES have `verifyOwner()`.
    // Let's just write a wrapper or execute the DB queries directly.
    console.log("Checking DB Connection...");

    try {
        await db.$queryRaw`SELECT 1;`;
        console.log("✅ DB Connection OK");
    } catch (e) {
        console.error("❌ DB Connection Failed", e);
    }

    try {
        // Just run the internal logic of integrity check.
        const dbTotal = await db.order.aggregate({
            _sum: { totalAmount: true },
            _count: { id: true }
        })
        console.log("✅ Prisma Aggregation OK, order count:", dbTotal._count.id);
    } catch (e) {
        console.error("❌ Prisma Aggregation Failed", e);
    }
}

testHealth().then(() => db.$disconnect()).catch(console.error);
