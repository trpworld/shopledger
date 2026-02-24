import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  try {
    const res = await prisma.order.create({
      data: {
        totalAmount: 100,
        paymentMode: "CASH",
        userId: "test", // This will fail foreign key constraint if user 'test' doesn't exist, but it will validate the schema first.
        discountAmount: 10,
      }
    })
    console.log("Success")
  } catch (e: any) {
    if (e.message.includes("Foreign key constraint failed on the field: `userId`")) {
        console.log("Discount amount is supported! Schema is fine.")
    } else {
        console.error(e)
    }
  }
}
main()
