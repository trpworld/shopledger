
const BASE_URL = 'http://localhost:3001'
import { PrismaClient } from '@prisma/client'

// Using Prisma to peek inside DB for verification
const db = new PrismaClient()

// Test Data
// We need real ID from DB
const MOCK_PRODUCT = {
    id: 'test-prod-1',
    barcode: '123456789',
    name: 'Test Chips',
    priceBuy: 10,
    priceSell: 20,
    gstRate: 18,
    stock: 100,
    category: 'Snacks'
}

async function runTest() {
    console.log('--- Testing Order Flow & Integrity ---')

    // 0. Ensure Product Exists in DB (we can use Prisma directly for setup)
    await db.product.upsert({
        where: { barcode: MOCK_PRODUCT.barcode },
        update: { stock: 100 },
        create: { ...MOCK_PRODUCT, isActive: true }
    })
    console.log('✅ Setup: Product ensured in DB')

    // 0.5 Get Real Owner
    const owner = await db.user.findFirst({ where: { role: 'OWNER' } })
    if (!owner) throw new Error('Owner not found in DB')
    const realUser = { name: owner.name, role: owner.role, id: owner.id }

    // 1. Get Auth Token
    let token = ''
    try {
        const res = await fetch(`${BASE_URL}/api/test-token`, {
            method: 'POST',
            body: JSON.stringify({ user: realUser })
        })
        const data = await res.json()
        token = data.token
        console.log('✅ Auth: Token acquired')
    } catch (e) {
        console.error('❌ Auth Failed', e)
        return
    }

    // 2. Create Order Attempt 1
    // Product Sell Price is 20. GST 18% is included? 
    // Wait, system logic: selling price is inclusive.
    // Base = 20 / 1.18 = 16.95. GST = 3.05.
    // Client sends total = 20 * qty.

    // Test Scenario: Client sends WRONG total. Server should fix it?
    // Actuall logic in createOrder: it recalculates based on DB price.
    // Let's send a spoofed cart with price 5 (should be 20).
    const cart = [{
        id: (await db.product.findFirst({ where: { barcode: '123456789' } }))?.id,
        qty: 2, // CORRECT PROPERTY NAME
        price: 5, // MALICIOUS CLIENT PRICE
        name: 'Test Chips'
    }]

    // Real total should be 40. Client says 10.
    const clientTotal = 10

    console.log('\n--- Test 1: Financial Integrity (Spoofed Price) ---')
    let orderId = ''
    try {
        const res = await fetch(`${BASE_URL}/api/staging/test-order`, {
            method: 'POST',
            headers: { 'Cookie': `session=${token}` },
            body: JSON.stringify({ cart, paymentMode: 'CASH', clientTotalAmount: clientTotal })
        })

        const json = await res.json()
        if (json.error) throw new Error(json.error)

        orderId = json.orderId
        console.log(`✅ Order Created: ID ${orderId}`)

        // Verify DB
        const order = await db.order.findUnique({
            where: { id: orderId },
            include: { items: true }
        })

        if (order?.totalAmount === 40) {
            console.log('✅ integrity: Server ignored client price (5) and used DB price (20). Total is 40.')
        } else {
            console.error(`❌ integrity: Server trusted client? Total is ${order?.totalAmount}, expected 40.`)
        }

    } catch (e) {
        console.error('❌ Order 1 Failed', e)
    }

    // 3. Idempotency Check
    // Reuse the exact same payload immediately?
    // App sets a 5s window.
    console.log('\n--- Test 2: Idempotency (Double Submit) ---')
    try {
        const res = await fetch(`${BASE_URL}/api/staging/test-order`, {
            method: 'POST',
            headers: { 'Cookie': `session=${token}` },
            body: JSON.stringify({ cart, paymentMode: 'CASH', clientTotalAmount: clientTotal })
        })

        const json = await res.json()

        if (json.orderId === orderId) {
            console.log(`✅ Idempotency: Duplicate request returned SAME Order ID ${orderId}`)
        } else {
            console.log(`❌ Idempotency: Created NEW Order ID ${json.orderId} (Expected duplicate prevention)`)
        }
    } catch (e) {
        console.error('❌ Order 2 Failed', e)
    }

}

runTest()
    .then(() => db.$disconnect())
    .catch((e) => {
        console.error(e)
        db.$disconnect()
        process.exit(1)
    })
