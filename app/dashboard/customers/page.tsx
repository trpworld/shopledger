import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import CustomerClient from './customer-client'
import { getCustomers } from '@/app/actions/customer-admin'

export default async function CustomersPage() {
    const session = await getSession()
    if (!session || session.user.role !== 'OWNER') {
        redirect('/dashboard') // Route protection
    }

    const customers = await getCustomers()

    return <CustomerClient initialCustomers={customers} />
}
