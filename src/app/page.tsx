'use client';

import { useMemo, useState } from 'react';
import ConfirmacionReserva from '@/components/ConfirmacionReserva';
import FormularioDatosPersonales, { type DatosPersonales } from '@/components/FormularioDatosPersonales';
import SeleccionEvento from '@/components/SeleccionEvento';
import CalendarioAdmin from '@/components/CalendarioAdmin';
import { Evento } from '@/domain/entities/evento';
import type { Profesional, TipoEvento } from '@/domain/entities/tipoEvento';
import type { Reserva } from '@/domain/services/editarReserva';
import { crearProfesionalMock } from '@/lib/mockProfesional';
import { ReservaEnMemoria } from '@/infrastructure/repositories/reservaEnMemoria';

// Datos de prueba de los casos CP-M05-009 (pendiente) y CP-M05-010 (cancelado).
const crearTurnosDemo = () => [
  new Evento('E-01', 'pendiente', new Date(2026, 10, 20, 10, 0), 'Consulta inicial', '2615555555', 'Juan Perez'),
  new Evento('E-02', 'cancelado', new Date(2026, 10, 20, 11, 0), 'Seguimiento', '2614444444', 'María López'),
];

export default function Home() {
  const [turnosDemo] = useState(crearTurnosDemo);
  const [profesional] = useState<Profesional>(() => crearProfesionalMock(new Date()));
  const [repositorio] = useState(() => new ReservaEnMemoria());
  const [seleccion, setSeleccion] = useState<{
    profesional: Profesional;
    evento: TipoEvento;
    fecha: string;
    horario: string;
  } | null>(null);
  const [reserva, setReserva] = useState<Reserva | null>(null);
  const [versionDisponibilidad, setVersionDisponibilidad] = useState(0);
  const [claveSeleccion, setClaveSeleccion] = useState(0);

  const horariosNoDisponibles = useMemo(
    () => repositorio.obtenerHorariosOcupados(),
    [repositorio, versionDisponibilidad]
  );

  const handleSubmit = (datos: DatosPersonales) => {
    if (!seleccion) {
      return;
    }

    setReserva({
      id: 'reserva-en-proceso',
      estado: 'en_proceso',
      datos: {
        profesional: seleccion.profesional.nombre,
        especialidad: seleccion.profesional.especialidad ?? '',
        tipoConsulta: seleccion.evento.nombre,
        duracion: seleccion.evento.duracionMinutos,
        fecha: seleccion.fecha,
        horario: seleccion.horario,
        descripcion: datos.nota || seleccion.evento.descripcion,
        modalidad: datos.modalidad ?? 'presencial',
        pacienteNombre: datos.nombre,
        pacienteEmail: datos.email,
        pacienteTelefono: datos.telefono,
      },
    });
  };

  const volverASeleccion = () => {
    setReserva(null);
    setSeleccion(null);
    setClaveSeleccion((valor) => valor + 1);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-100 to-zinc-200 p-4 flex flex-col items-center">
      {!reserva ? (
        <>
          <SeleccionEvento
            key={claveSeleccion}
            profesional={profesional}
            horariosNoDisponibles={horariosNoDisponibles}
            onSeleccionarHorario={setSeleccion}
          />
          {seleccion && (
            <div className="max-w-sm mx-auto mt-6 w-full">
              <FormularioDatosPersonales
                mostrarModalidad
                onSubmit={handleSubmit}
                onCancel={volverASeleccion}
              />
            </div>
          )}
        </>
      ) : (
        <ConfirmacionReserva
          reserva={reserva}
          onConfirmada={(resultado, reservaActual) => {
            repositorio.registrarTurno(resultado.turnoId!, reservaActual.datos);
            setReserva({
              ...reservaActual,
              id: resultado.turnoId ?? reservaActual.id,
              estado: 'confirmada',
            });
            setVersionDisponibilidad((valor) => valor + 1);
          }}
          onCancelada={(reservaActual) => {
            repositorio.cancelarTurno(reservaActual.id);
            setVersionDisponibilidad((valor) => valor + 1);
            volverASeleccion();
          }}
        />
      )}
      <h1 className="mt-10 mb-4 text-xl font-semibold text-zinc-800">Panel del administrador</h1>
      <CalendarioAdmin turnos={turnosDemo} />
    </main>
  );
}