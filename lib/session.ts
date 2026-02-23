import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const key = new TextEncoder().encode(process.env.JWT_SECRET || 'secretKey')

export async function encrypt(payload: any) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1d')
        .sign(key)
}

export async function decrypt(input: string): Promise<any> {
    const { payload } = await jwtVerify(input, key, {
        algorithms: ['HS256'],
    })
    return payload
}

export async function getSession() {
    const session = (await cookies()).get('session')?.value
    if (!session) return null
    try {
        return await decrypt(session)
    } catch (error) {
        return null
    }
}

export async function login(userData: any) {
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const session = await encrypt({ user: userData, expires })

        // Await cookies()
        ; (await cookies()).set('session', session, { expires, httpOnly: true })
}

export async function logout() {
    (await cookies()).set('session', '', { expires: new Date(0) })
}
