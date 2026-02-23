import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function main() {
    const hashedPassword = await bcrypt.hash('admin123', 10)

    const user = await db.user.upsert({
        where: { id: 'admin-user' }, // Assuming checking by ID is okay, but schema uses UUID. 
        // Wait, schema: id String @id @default(uuid()).
        // Upsert needs a unique field. `name` is not unique in schema. `id` is PK.
        // I can't upsert by `name` unless it's unique.
        // I should create a user if not exists on `name`.
        update: {},
        create: {
            name: 'Owner',
            role: 'OWNER',
            password: hashedPassword
        },
    })

    // Since `name` is not unique in schema, upsert on `id` won't find it if I don't know the ID used previously.
    // Better to check if user exists by name.
}

// Rewriting main to be safer given schema constraints
async function secureSeed() {
    const hashedPassword = await bcrypt.hash('admin123', 10)

    const existingUser = await db.user.findFirst({ where: { name: 'Owner' } })

    if (!existingUser) {
        await db.user.create({
            data: { name: 'Owner', role: 'OWNER', password: hashedPassword }
        })
        console.log('Owner user created')
    }

    // Cashier
    const cashier = await db.user.findFirst({ where: { name: 'Cashier' } })
    if (!cashier) {
        await db.user.create({
            data: { name: 'Cashier', role: 'CASHIER', password: hashedPassword }
        })
        console.log('Cashier user created')
    }

    // Helper
    const helper = await db.user.findFirst({ where: { name: 'Helper' } })
    if (!helper) {
        await db.user.create({
            data: { name: 'Helper', role: 'HELPER', password: hashedPassword }
        })
        console.log('Helper user created')
    }
}

secureSeed()
    .then(async () => {
        await db.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await db.$disconnect()
        process.exit(1)
    })
