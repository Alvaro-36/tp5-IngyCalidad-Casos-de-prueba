'use client';

import SeleccionEvento from '@/components/SeleccionEvento';
import FormularioDatosPersonales from '@/components/FormularioDatosPersonales';
import CalendarioAdmin from '@/components/CalendarioAdmin';
import { Evento } from '@/domain/entities/evento';
import { useState } from 'react';

// Datos de prueba de los casos CP-M05-009 (pendiente) y CP-M05-010 (cancelado),
// y de los casos CP-M05-011 (reserva activa futura, cancelable) y CP-M05-012 (fecha pasada).
const crearTurnosDemo = () => [
  new Evento('E-01', 'pendiente', new Date(2026, 10, 20, 10, 0), 'Consulta inicial', '2615555555', 'Juan Perez'),
  new Evento('E-02', 'cancelado', new Date(2026, 10, 20, 11, 0), 'Seguimiento', '2614444444', 'María López'),
  new Evento('E-11', 'confirmado', new Date(2026, 10, 25, 15, 0), 'Renovación de receta', '2613333333', 'Ana Torres'),
  new Evento('E-12', 'confirmado', new Date(2026, 9, 1, 9, 0), 'Control mensual', '2612222222', 'Luis Gómez'),
];

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
      <CalendarioAdmin turnos={turnosDemo} />
    </main>
  );
}