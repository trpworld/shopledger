import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decrypt } from '@/lib/session'

export async function middleware(request: NextRequest) {
    const sessionCookie = request.cookies.get('session')?.value
    const session = sessionCookie ? await decrypt(sessionCookie) : null

    const isLoginPage = request.nextUrl.pathname.startsWith('/login')

    if (!session && !isLoginPage) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    if (session) {
        if (isLoginPage) {
            return NextResponse.redirect(new URL('/pos', request.url))
        }

        const isDashboard = request.nextUrl.pathname.startsWith('/dashboard')
        if (isDashboard && session.user.role !== 'OWNER') {
            return NextResponse.redirect(new URL('/pos', request.url))
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
