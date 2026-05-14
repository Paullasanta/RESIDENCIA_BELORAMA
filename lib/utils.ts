import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(name: string | null | undefined): string {
    if (!name) return '??'
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
}

/**
 * Retorna el objeto Date actual forzado a la zona horaria de Lima, Perú.
 * Útil para comparaciones de fechas y para asegurar que "hoy" sea siempre hoy en Lima.
 */
export function getLimaNow(): Date {
    const now = new Date();
    // Esto genera una cadena de fecha local en Lima y la parsea de nuevo
    // para obtener un objeto Date cuyos componentes (getFullYear, etc) sean los de Lima.
    const limaString = now.toLocaleString("en-US", { timeZone: "America/Lima" });
    return new Date(limaString);
}
