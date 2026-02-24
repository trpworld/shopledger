import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  await prisma.$executeRaw`DELETE FROM Offer;`
  console.log('Wiped offers')
}
main()
