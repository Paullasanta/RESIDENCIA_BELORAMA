import NextAuth from 'next-auth'
import { authConfig } from './lib/auth.config'

export default NextAuth(authConfig).auth

export const config = {
    // Proteger todas las rutas de módulos, pero permitir acceso a login/api
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|auth).*)'],
}
