import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const offers = await prisma.offer.findMany()
  console.log("All Offers:", JSON.stringify(offers, null, 2))
}
main()
