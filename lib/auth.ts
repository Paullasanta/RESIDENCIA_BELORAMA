import NextAuth from 'next-auth'
import { authConfig } from './auth.config'
import { prisma } from './prisma'
import { unstable_noStore as noStore } from 'next/cache'
import CredentialsProvider from 'next-auth/providers/credentials'

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
    ...authConfig,
    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null

                const user = await prisma.user.findFirst({
                    where: { 
                        email: { 
                            equals: credentials.email as string, 
                            mode: 'insensitive' 
                        } 
                    },
                    include: {
                        residente: true,
                        role: {
                            include: {
                                permissions: {
                                    include: { permission: true }
                                }
                            }
                        }
                    }
                })

                // En Belorama usamos contraseñas en texto plano según tu configuración
                if (!user || user.password !== credentials.password) {
                    return null
                }

                if (user.residente && user.residente.activo === false) {
                    throw new Error('Cuenta inactiva')
                }

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
            if (trigger === "update" && session?.user) {
                if (session.user.nombre) token.nombre = session.user.nombre
            }
            return token
        },
        async session({ session, token }) {
            noStore()
            if (!token || !token.id) return session
            
            // Verificación mínima para no sobrecargar el servidor
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
    secret: process.env.NEXTAUTH_SECRET,
    trustHost: true,
})