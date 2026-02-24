import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  await prisma.offer.updateMany({ data: { isActive: false } })
  const offer = await prisma.offer.create({
    data: {
      title: 'TEST OFFER 20%',
      message: 'Show this for 20% off',
      validTill: new Date(Date.now() + 86400000), // Tomorrow
      isActive: true
    }
  })
  console.log('Created active offer:', offer)
}
main()
