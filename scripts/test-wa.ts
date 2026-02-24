import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const customer = await prisma.customer.upsert({
    where: { phone: '8927202527' },
    update: {},
    create: { phone: '8927202527', name: 'Test User', lastVisit: new Date() }
  })

  const product = await prisma.product.findFirst()

  const order = await prisma.order.create({
    data: {
      customerId: customer.id,
      totalAmount: 100,
      paymentMode: 'CASH',
      items: {
        create: {
          productId: product?.id || 'dummy',
          quantity: 1,
          price: 100,
          gstRate: 0
        }
      }
    }
  })
  console.log('Created order ID:', order.id)
}
main()
