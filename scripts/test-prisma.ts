import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const s = await prisma.setting.findMany()
  console.log('SUCCESS: Settings fetch worked!', s)
}
main().catch(console.error).finally(() => prisma.$disconnect())
