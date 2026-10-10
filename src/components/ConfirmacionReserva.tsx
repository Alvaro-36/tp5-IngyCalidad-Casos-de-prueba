'use client';

import { useState } from 'react';
import { cancelarReservaEnProceso } from '@/domain/services/cancelacion';
import { confirmarReserva, type ResultadoConfirmacion } from '@/domain/services/reserva';
import { getResumenReserva, type Reserva } from '@/domain/services/editarReserva';

interface Props {
	reserva: Reserva;
	onConfirmada?: (resultado: ResultadoConfirmacion, reserva: Reserva) => void;
	onCancelada?: (reserva: Reserva) => void;
}

export default function ConfirmacionReserva({ reserva, onConfirmada, onCancelada }: Props) {
	const resumen = getResumenReserva(reserva);
	const [dialogoAbierto, setDialogoAbierto] = useState(false);
	const [mensaje, setMensaje] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	function confirmar() {
		try {
			const resultado = confirmarReserva(reserva.datos);
			setError(null);
			setMensaje(resultado.mensaje);
			onConfirmada?.(resultado, reserva);
		} catch (exception) {
			setMensaje(null);
			setError(exception instanceof Error ? exception.message : String(exception));
		}
	}

	function cancelar() {
		try {
			cancelarReservaEnProceso({ reservaId: reserva.id, estadoActual: reserva.estado });
			setDialogoAbierto(false);
			onCancelada?.(reserva);
		} catch (exception) {
			setDialogoAbierto(false);
			setError(exception instanceof Error ? exception.message : String(exception));
		}
	}

	return (
		<section aria-label="Confirmación de reserva" className="mx-auto w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl ring-1 ring-zinc-200">
			<header className="mb-6 border-b border-zinc-200 pb-4">
				<p className="text-sm font-medium uppercase tracking-[0.18em] text-indigo-600">Último paso</p>
				<h1 className="mt-1 text-2xl font-semibold text-zinc-900">Confirmar reserva</h1>
			</header>

			<dl className="grid gap-4 sm:grid-cols-2">
				{[
					['Profesional', resumen.profesional],
					['Especialidad', resumen.especialidad],
					['Tipo de consulta', resumen.tipoConsulta],
					['Duración', `${resumen.duracion} minutos`],
					['Fecha', resumen.fecha],
					['Horario', resumen.horario],
					['Descripción de la consulta', resumen.descripcion],
					['Modalidad', resumen.modalidad],
					['Nombre y apellido', resumen.pacienteNombre],
					['Email', resumen.pacienteEmail],
					['Teléfono', resumen.pacienteTelefono || 'No informado'],
				].map(([etiqueta, valor]) => (
					<div key={etiqueta}>
						<dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{etiqueta}</dt>
						<dd className="mt-1 text-sm text-zinc-900">{valor}</dd>
					</div>
				))}
			</dl>

			{mensaje && <p role="status" className="mt-6 rounded-lg bg-green-50 px-4 py-3 font-medium text-green-800">{mensaje}</p>}
			{error && <p role="alert" className="mt-6 rounded-lg bg-red-50 px-4 py-3 font-medium text-red-800">{error}</p>}

			<div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
				<button type="button" onClick={() => setDialogoAbierto(true)} className="rounded-lg border border-zinc-300 px-4 py-2 font-medium text-zinc-700 hover:bg-zinc-50">
					Cancelar reserva
				</button>
				<button type="button" onClick={confirmar} className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700">
					Confirmar reserva
				</button>
			</div>

			{dialogoAbierto && (
				<div role="dialog" aria-modal="true" aria-labelledby="titulo-cancelacion" className="fixed inset-0 z-10 flex items-center justify-center bg-zinc-950/40 p-4">
					<div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
						<h2 id="titulo-cancelacion" className="text-lg font-semibold text-zinc-900">¿Cancelar reserva?</h2>
						<p className="mt-2 text-sm text-zinc-600">El horario quedará disponible nuevamente.</p>
						<div className="mt-6 flex justify-end gap-3">
							<button type="button" onClick={() => setDialogoAbierto(false)} className="rounded-lg border border-zinc-300 px-4 py-2 font-medium text-zinc-700">Volver</button>
							<button type="button" onClick={cancelar} className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white">Confirmar cancelación</button>
						</div>
					</div>
				</div>
			)}
		</section>
	);
}