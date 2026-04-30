import { updateResidente } from './app/actions/residentes';
import { prisma } from './lib/prisma';

async function main() {
  const residente = await prisma.residente.findUnique({
    where: { id: 17 },
    include: { user: true }
  });

  const formData = {
    dni: residente?.user.dni,
    nombre: residente?.user.nombre,
    apellidoPaterno: residente?.user.apellidoPaterno,
    apellidoMaterno: residente?.user.apellidoMaterno,
    email: residente?.user.email,
    telefono: residente?.user.telefono,
    emergenciaNombre: residente?.user.emergenciaNombre,
    emergenciaTelefono: residente?.user.emergenciaTelefono,
    emergenciaParentesco: residente?.user.emergenciaParentesco,
    residenciaId: residente?.user.residenciaId?.toString(),
    habitacionId: residente?.habitacionId?.toString(),
    fechaIngreso: "2026-03-29",
    fechaFinal: "2026-05-29",
    diaPago: "29",
    montoMensual: "300",
    montoGarantia: "200"
  };

  console.log("Calling updateResidente...");
  const result = await updateResidente(17, formData);
  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);
