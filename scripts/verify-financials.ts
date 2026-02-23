
import { verifySystemIntegrity } from '@/lib/analytics'
import { db } from '@/lib/db'

async function runCheck() {
    console.log('--- Verifying System Financial Integrity ---')
    const result = await verifySystemIntegrity()

    console.log('Status:', result.status)
    console.log('Revenue Diff:', result.revenueDiff)
    console.log('Order Count:', result.orderCount)

    if (result.status === 'MATCH') {
        console.log('✅ Integrity Check Passed')
    } else {
        console.error('❌ Integrity Check Failed')
    }
}

runCheck()
    .then(() => db.$disconnect())
    .catch((e) => {
        console.error(e)
        db.$disconnect()
        process.exit(1)
    })
