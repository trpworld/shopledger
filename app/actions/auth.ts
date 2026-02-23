'use server'

import { db } from '@/lib/db'
import { login } from '@/lib/session'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'

export async function loginAction(formData: FormData) {
    let redirectPath = '/pos'

    try {
        const name = (formData.get('name') as string)?.trim()
        const password = formData.get('password') as string

        if (!name || !password) {
            return { error: 'Please populate all fields' }
        }

        const user = await db.user.findFirst({
            where: { name },
        })

        if (!user) {
            return { error: 'Invalid credentials' }
        }

        const passwordsMatch = await bcrypt.compare(password, user.password)

        if (!passwordsMatch) {
            return { error: 'Invalid credentials' }
        }

        await login({ id: user.id, name: user.name, role: user.role })

        // Determine the correct redirect route
        if (user.role === 'OWNER') {
            redirectPath = '/dashboard'
        } else if (user.role === 'HELPER' || user.role === 'CASHIER') {
            redirectPath = '/pos'
        }

    } catch (err: any) {
        console.error("Login Server Action Error:", err)
        return { error: 'Internal Server Error: ' + err.message }
    }

    redirect(redirectPath)
}
