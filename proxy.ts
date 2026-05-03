import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

// Config liviana: solo verifica el JWT, sin Prisma (Edge-compatible)
const { auth } = NextAuth({
    providers: [
        CredentialsProvider({
            credentials: { email: {}, password: {} },
            async authorize() { return null }
        })
    ],
    callbacks: {
        authorized({ auth }) {
            // Solo verifica que el token JWT exista en la cookie
            return !!auth?.user
        },
        async jwt({ token, user }) {
            if (user) token.id = user.id
            return token
        },
        async session({ session }) {
            return session
        }
    },
    pages: { signIn: '/auth/login' },
    session: { strategy: 'jwt' },
    secret: process.env.NEXTAUTH_SECRET,
})

export default auth

export const config = {
    matcher: ['/modules/:path*']
}
