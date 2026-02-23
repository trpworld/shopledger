import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
    return new PrismaClient()
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma2 = globalThis as unknown as {
    prisma2: PrismaClientSingleton | undefined
}

export const db = globalForPrisma2.prisma2 ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalForPrisma2.prisma2 = db
