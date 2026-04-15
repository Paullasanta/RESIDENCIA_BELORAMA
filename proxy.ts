import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
    const session = await auth()
    const { pathname } = request.nextUrl

    if (!session && (
        pathname.startsWith('/admin') ||
        pathname.startsWith('/residente') ||
        pathname.startsWith('/cocinero')
    )) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/admin/:path*', '/residente/:path*', '/cocinero/:path*']
}
