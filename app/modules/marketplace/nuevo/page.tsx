import { PageHeader } from '@/components/shared/PageHeader'
import { ProductoForm } from '@/components/forms/ProductoForm'

export default function NuevoProductoPage() {
    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-500">
            <PageHeader
                title="Nueva Publicación"
                description="Promociona tus productos o servicios con el resto de la comunidad."
            />
            
            <ProductoForm />
        </div>
    )
}
