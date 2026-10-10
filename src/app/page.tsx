'use client';

import SeleccionEvento from '@/components/SeleccionEvento';
import FormularioDatosPersonales from '@/components/FormularioDatosPersonales';
import CalendarioAdmin from '@/components/CalendarioAdmin';
import { Evento } from '@/domain/entities/evento';
import { useState } from 'react';

// Datos de prueba de los casos CP-M05-009 (pendiente) y CP-M05-010 (cancelado).
const crearTurnosDemo = () => [
  new Evento('E-01', 'pendiente', new Date(2026, 10, 20, 10, 0), 'Consulta inicial', '2615555555', 'Juan Perez'),
  new Evento('E-02', 'cancelado', new Date(2026, 10, 20, 11, 0), 'Seguimiento', '2614444444', 'María López'),
];

const HORARIOS_REAGENDADO_DEMO = [new Date(2026, 10, 22, 15, 30)];

export default function Home() {
  const [turnosDemo] = useState(crearTurnosDemo);

  const handleSubmit = () => {
    alert('Datos guardados correctamente. Redireccionando a Confirmar Reserva');
  };

  const handleCancel = () => {
    alert('Redireccionando a calendario');
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-100 to-zinc-200 p-4 flex flex-col items-center">
      <SeleccionEvento />
      <div className="max-w-sm mx-auto mt-6 w-full">
        <FormularioDatosPersonales onSubmit={handleSubmit} onCancel={handleCancel} />
      </div>
      <h1 className="mt-10 mb-4 text-xl font-semibold text-zinc-800">Panel del administrador</h1>
      <CalendarioAdmin turnos={turnosDemo} horariosDisponiblesReagendado={HORARIOS_REAGENDADO_DEMO} />
    </main>
  );
}
