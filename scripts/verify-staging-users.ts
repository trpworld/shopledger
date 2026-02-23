
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function verifyUsers() {
    console.log('--- Verifying Staging Users ---')

    const users = [
        { name: 'Owner', role: 'OWNER', pass: 'admin123' },
        { name: 'Cashier', role: 'CASHIER', pass: 'admin123' },
        { name: 'Helper', role: 'HELPER', pass: 'admin123' }
    ]

    for (const u of users) {
        const user = await db.user.findFirst({ where: { name: u.name } })

        if (!user) {
            console.error(`❌ ${u.name}: User NOT FOUND`)
            continue
        }

        const isPasswordValid = await bcrypt.compare(u.pass, user.password)
        const isRoleValid = user.role === u.role

        if (isPasswordValid && isRoleValid) {
            console.log(`✅ ${u.name}: Credentials & Role Verified`)
        } else {
            console.error(`❌ ${u.name}: Failed`)
            if (!isPasswordValid) console.error(`   - Password Mismatch`)
            if (!isRoleValid) console.error(`   - Role Mismatch (Expected ${u.role}, Got ${user.role})`)
        }
    }
}

verifyUsers()
    .then(async () => {
        await db.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await db.$disconnect()
        process.exit(1)
    })
