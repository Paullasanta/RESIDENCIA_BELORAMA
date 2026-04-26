import NextAuth, { type DefaultSession } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'

// Extender tipos de NextAuth
declare module 'next-auth' {
    interface Session {
        user: {
            id: number
            nombre: string
            email: string
            rol: string
            permisos: string[]
            residenciaId?: number | null
        }
    }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email as string },
                    include: {
                        role: {
                            include: {
                                permissions: {
                                    include: { permission: true }
                                }
                            }
                        }
                    }
                })

                if (!user || user.password !== credentials.password) return null

                return {
                    id: user.id.toString(),
                    nombre: user.nombre,
                    email: user.email,
                    rol: user.role?.name || 'RESIDENTE',
                    permisos: user.role?.permissions.map(p => p.permission.key) || [],
                    residenciaId: user.residenciaId,
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = Number(user.id)
                token.rol = (user as any).rol
                token.nombre = (user as any).nombre
                token.permisos = (user as any).permisos
                token.residenciaId = (user as any).residenciaId
            }
            
            // Manejar actualización de sesión en tiempo real
            if (trigger === "update" && session?.user) {
                if (session.user.nombre) token.nombre = session.user.nombre
            }
            
            return token
        },
        async session({ session, token }) {
            if (token && session.user) {
                ;(session.user as any).id = Number(token.id)
                session.user.rol = token.rol as string
                session.user.nombre = token.nombre as string
                session.user.permisos = token.permisos as string[]
                ;(session.user as any).residenciaId = token.residenciaId as number | null
            }
            return session
        }
    },
    pages: {
        signIn: '/auth/login',
    },
    session: {
        strategy: 'jwt',
    },
    secret: process.env.NEXTAUTH_SECRET,
})