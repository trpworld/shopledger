import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const offer = await prisma.offer.findUnique({
        where: { code: "NEXT15" }
    })
    console.log(offer);
    
    if (!offer) console.log({ error: "Invalid promo code" })
    else if (!offer.isActive) console.log({ error: "Promo code is not active" })
    else if (new Date(offer.validTill) < new Date()) console.log({ error: "Promo code has expired" })
    else console.log({ success: true, discountPercentage: offer.discountPercentage, title: offer.title })
}
main()
