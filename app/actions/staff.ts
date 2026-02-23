'use server'

import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import bcrypt from 'bcryptjs'

const verifyOwner = async () => {
    const session = await getSession()
    if (!session || session.user.role !== 'OWNER') {
        throw new Error('Unauthorized')
    }
}

export async function createStaff(data: { name: string, role: string, password: string }) {
    await verifyOwner()

    // Explicit server-side validation enforcing strong passwords
    if (!data.password || data.password.length < 8) {
        return { error: 'Password must be at least 8 characters long.' }
    }
    if (!data.name || data.name.trim() === '') {
        return { error: 'Name is required.' }
    }

    try {
        const existingUser = await db.user.findFirst({ where: { name: data.name } })
        if (existingUser) {
            return { error: 'User with this name already exists' }
        }

        const hashedPassword = await bcrypt.hash(data.password, 10)

        const user = await db.user.create({
            data: {
                name: data.name,
                role: data.role as any, // 'CASHIER' | 'HELPER' | 'OWNER'
                password: hashedPassword
            }
        })
        return { success: true, user: { id: user.id, name: user.name, role: user.role } }
    } catch (e: any) {
        return { error: e.message }
    }
}

export async function updateStaffPassword(userId: string, newPassword: string) {
    await verifyOwner()

    if (!newPassword || newPassword.length < 8) {
        return { error: 'Password must be at least 8 characters long.' }
    }

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        await db.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        })
        return { success: true }
    } catch (e: any) {
        return { error: e.message }
    }
}
