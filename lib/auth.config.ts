import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
    providers: [], // Los proveedores se definen en auth.ts para usar Prisma
    pages: {
        signIn: '/auth/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const isModuleRoute = nextUrl.pathname.startsWith('/modules')
            
            if (isModuleRoute) {
                if (isLoggedIn) return true
                return false // Redirige al login
            }
            return true
        },
    },
} satisfies NextAuthConfig
