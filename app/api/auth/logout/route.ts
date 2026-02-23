
import { logout } from '@/lib/session'
import { redirect } from 'next/navigation'

export async function POST() {
    await logout()
    redirect('/login')
}
