import { auth } from './auth'

export async function checkAuth(requiredPermission?: string) {
    const session = await auth()
    if (!session || !session.user) {
        throw new Error('No autorizado: Sesión no iniciada')
    }

    if (requiredPermission && !session.user.permisos.includes(requiredPermission) && session.user.rol !== 'ADMIN') {
        throw new Error('No autorizado: Permisos insuficientes')
    }

    return session.user
}

/**
 * Valida si el usuario tiene acceso a un recurso específico basado en la residencia.
 * Si es Admin Global, tiene acceso a todo.
 * Si no, el residenciaId del recurso debe coincidir con el del usuario.
 */
export function checkResidenciaAccess(user: any, resourceResidenciaId: number | null) {
    if ((user.rol === 'ADMIN' || user.rol === 'COCINERO') && !user.residenciaId) return true // Global Admin/Cocinero
    if (user.residenciaId === resourceResidenciaId) return true
    throw new Error('No autorizado: No tienes acceso a los recursos de esta residencia')
}
