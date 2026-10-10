'use client';

import { useState, useMemo } from 'react';
import { Evento } from '@/domain/entities/evento';
import { aISO, aSoloDia, NOMBRES_MES } from '@/lib/fecha';

interface Props {
	// Inyectables para pruebas deterministas
	hoy?: Date;
	reservas?: string[]; // Lista de fechas ISO para compatibilidad retroactiva
	turnos?: Evento[];   // Turnos completos para mostrar en el panel de reservas
	onSeleccionarDia?: (fecha: Date) => void;
	onConfirmar?: (turno: Evento) => void; // Ej: disparar el email al invitado
	onReagendar?: (turno: Evento) => void; // Ej: notificar al usuario invitado
	horariosDisponiblesReagendado?: Date[];
}

const ETIQUETAS_ESTADO: Record<string, string> = {
	pendiente: 'Pendiente',
	confirmado: 'Confirmado',
	cancelado: 'Cancelado',
	completado: 'Completado',
};

const COLORES_ESTADO: Record<string, string> = {
	pendiente: 'bg-amber-100 text-amber-800',
	confirmado: 'bg-green-100 text-green-800',
	cancelado: 'bg-red-100 text-red-800',
	completado: 'bg-zinc-200 text-zinc-700',
};

const DIAS_SEMANA = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

export default function CalendarioAdmin({ hoy, reservas = [], turnos = [], onSeleccionarDia, onConfirmar, onReagendar, horariosDisponiblesReagendado = [] }: Props) {
	const fechaHoy = useMemo(() => aSoloDia(hoy ?? new Date()), [hoy]);
	
	// El mes/año visible se inicializa con el mes de fechaHoy
	const [mesVisible, setMesVisible] = useState(() => new Date(fechaHoy.getFullYear(), fechaHoy.getMonth(), 1));
	
	// El día seleccionado por defecto es hoy (representado como ISO string)
	const [fechaSeleccionada, setFechaSeleccionada] = useState<string>(() => aISO(fechaHoy));

	// Id del último evento confirmado, para mostrar el mensaje de éxito (M05-US5).
	// Se guarda el id (y no el texto) para forzar el re-render en cada confirmación.
	const [ultimoConfirmado, setUltimoConfirmado] = useState<string | null>(null);
	const [ultimoReagendado, setUltimoReagendado] = useState<string | null>(null);
	const [turnoAReagendar, setTurnoAReagendar] = useState<Evento | null>(null);
	const [fechaReagendada, setFechaReagendada] = useState('');

	const cambiarMes = (delta: number) => {
		setMesVisible((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
	};

	const cambiarAnio = (delta: number) => {
		setMesVisible((prev) => new Date(prev.getFullYear() + delta, prev.getMonth(), 1));
	};

	// Cálculo de los días del mes visible
	const anioVisible = mesVisible.getFullYear();
	const mesVisibleIndex = mesVisible.getMonth();
	
	const diasDelMes = new Date(anioVisible, mesVisibleIndex + 1, 0).getDate();
	const dias = Array.from({ length: diasDelMes }, (_, i) => i + 1);
	
	// Offset para alinear el día 1 con su columna (lunes = 0, domingo = 6)
	const primerDiaSemana = (new Date(anioVisible, mesVisibleIndex, 1).getDay() + 6) % 7;

	// Días que tienen reservas (derivados de `turnos` si existe, o usando la prop `reservas`)
	const diasConReservas = (() => {
		if (turnos && turnos.length > 0) {
			return Array.from(new Set(turnos.map((t) => aISO(t.obtenerFechaHora()))));
		}
		return reservas;
	})();

	// Turnos correspondientes al día seleccionado, ordenados cronológicamente
	const turnosDelDia = (() => {
		return turnos
			.filter((t) => aISO(t.obtenerFechaHora()) === fechaSeleccionada)
			.sort((a, b) => a.obtenerFechaHora().getTime() - b.obtenerFechaHora().getTime());
	})();

	const seleccionarDia = (dia: number) => {
		const fecha = new Date(anioVisible, mesVisibleIndex, dia);
		const iso = aISO(fecha);
		setFechaSeleccionada(iso);
		setUltimoConfirmado(null);
		if (onSeleccionarDia) {
			onSeleccionarDia(fecha);
		}
	};

	const confirmarTurno = (turno: Evento) => {
		turno.confirmar();
		setUltimoConfirmado(turno.obtenerId());
		if (onConfirmar) {
			onConfirmar(turno);
		}
	};

	const abrirReagendado = (turno: Evento) => {
		setTurnoAReagendar(turno);
		setFechaReagendada(horariosDisponiblesReagendado[0]?.toISOString() ?? '');
	};

	const confirmarReagendado = () => {
		if (!turnoAReagendar || !fechaReagendada) return;
		turnoAReagendar.reagendar(new Date(fechaReagendada));
		setUltimoReagendado(turnoAReagendar.obtenerId());
		setTurnoAReagendar(null);
		onReagendar?.(turnoAReagendar);
	};

	return (
		<div className="flex flex-col md:flex-row gap-6 max-w-4xl w-full">
			{/* Panel del Calendario */}
			<section
				aria-label="Calendario de Administrador"
				className="flex-1 flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm max-w-sm w-full"
			>
				{/* Controles de Navegación de Mes y Año */}
				<div className="flex items-center justify-between gap-2 border-b border-zinc-100 pb-3">
					<div className="flex gap-1">
						<button
							type="button"
							onClick={() => cambiarAnio(-1)}
							aria-label="Año anterior"
							className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 transition-colors"
						>
							«
						</button>
						<button
							type="button"
							onClick={() => cambiarMes(-1)}
							aria-label="Mes anterior"
							className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 transition-colors"
						>
							‹
						</button>
					</div>
					
					<span className="font-semibold capitalize text-zinc-800 text-sm md:text-base">
						{NOMBRES_MES[mesVisibleIndex]} {anioVisible}
					</span>
					
					<div className="flex gap-1">
						<button
							type="button"
							onClick={() => cambiarMes(1)}
							aria-label="Mes siguiente"
							className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 transition-colors"
						>
							›
						</button>
						<button
							type="button"
							onClick={() => cambiarAnio(1)}
							aria-label="Año siguiente"
							className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 transition-colors"
						>
							»
						</button>
					</div>
				</div>

				{/* Grid de días de la semana y días del mes */}
				<div className="grid grid-cols-7 gap-1 text-center">
					{DIAS_SEMANA.map((d) => (
						<span key={d} className="flex h-8 items-center justify-center text-xs font-semibold text-zinc-400">
							{d}
						</span>
					))}
					
					{/* Espacios vacíos antes del primer día del mes */}
					{Array.from({ length: primerDiaSemana }, (_, i) => (
						<span key={`vacio-${i}`} aria-hidden="true" />
					))}
					
					{/* Días del mes */}
					{dias.map((dia) => {
						const fecha = new Date(anioVisible, mesVisibleIndex, dia);
						const iso = aISO(fecha);
						
						const esSeleccionado = iso === fechaSeleccionada;
						const tieneReserva = diasConReservas.includes(iso);
						
						// Clases de estilo para el día
						let classes = "flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-all relative ";
						
						if (esSeleccionado) {
							// Círculo verde para el día seleccionado
							classes += "bg-green-500 text-white shadow-sm hover:bg-green-600";
						} else if (tieneReserva) {
							// Círculo gris para días con reservas
							classes += "bg-zinc-200 text-zinc-800 hover:bg-zinc-300";
						} else {
							// Día sin destacar
							classes += "text-zinc-700 hover:bg-zinc-100";
						}

						return (
							<button
								key={dia}
								type="button"
								onClick={() => seleccionarDia(dia)}
								aria-pressed={esSeleccionado}
								aria-label={tieneReserva ? `${dia}, con reservas` : `${dia}`}
								className={classes}
							>
								{dia}
							</button>
						);
					})}
				</div>

				{/* Referencias visuales */}
				<div className="flex gap-4 border-t border-zinc-100 pt-3 text-xs text-zinc-500">
					<span className="flex items-center gap-1.5">
						<span className="inline-block h-3 w-3 rounded-full bg-zinc-200" aria-hidden="true" /> Con reservas
					</span>
					<span className="flex items-center gap-1.5">
						<span className="inline-block h-3 w-3 rounded-full bg-green-500" aria-hidden="true" /> Seleccionado
					</span>
				</div>
			</section>

			{/* Panel de Reservas del día */}
			<section
				aria-label="Reservas del día"
				className="flex-1 flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm min-w-[320px] max-w-sm w-full"
			>
				<h2 className="text-lg font-semibold text-zinc-800 border-b border-zinc-100 pb-2">
					Reservas del día
				</h2>

				{ultimoConfirmado !== null && (
					<p role="status" className="rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-800">
						Evento confirmado correctamente
					</p>
				)}
				{ultimoReagendado !== null && (
					<p role="status" className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-800">
						Evento reagendado correctamente. Se notificó al usuario del cambio de horario.
					</p>
				)}
				
				{turnosDelDia.length > 0 ? (
					<div className="flex flex-col gap-3 overflow-y-auto max-h-[350px] pr-1">
						{turnosDelDia.map((turno) => {
							const hora = String(turno.obtenerFechaHora().getHours()).padStart(2, '0') + ':' + 
							             String(turno.obtenerFechaHora().getMinutes()).padStart(2, '0');
							const estado = turno.obtenerEstado();
							return (
								<article
									key={turno.obtenerId()}
									aria-label={`Turno de ${turno.obtenerNombre()}`}
									className="rounded-lg border border-zinc-150 p-4 shadow-sm hover:shadow transition-all bg-zinc-50 flex flex-col gap-1.5"
								>
									<div className="flex justify-between items-center">
										<span className="font-semibold text-zinc-900 text-sm md:text-base">
											{turno.obtenerNombre()}
										</span>
										<span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
											{hora} hs
										</span>
									</div>
									<div className="text-xs md:text-sm text-zinc-600 flex flex-col gap-0.5">
										<p><span className="font-medium text-zinc-500">Teléfono:</span> {turno.obtenerTelefono() || 'No provisto'}</p>
										<p><span className="font-medium text-zinc-550">Consulta:</span> {turno.obtenerDescripcion() || 'Sin descripción'}</p>
									</div>
									<div className="flex justify-between items-center pt-1">
										<span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${COLORES_ESTADO[estado] ?? 'bg-zinc-100 text-zinc-700'}`}>
											{ETIQUETAS_ESTADO[estado] ?? estado}
										</span>
										{/* M05-US5: la opción solo se muestra para eventos pendientes */}
										{turno.puedeConfirmarse() && (
											<button
												type="button"
												onClick={() => confirmarTurno(turno)}
												aria-label={`Confirmar turno de ${turno.obtenerNombre()}`}
												className="rounded-md bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700 transition-colors"
											>
												Confirmar
											</button>
										)}
										<button
											type="button"
											disabled={!turno.puedeReagendarse()}
											onClick={() => abrirReagendado(turno)}
											aria-label={`Reagendar turno de ${turno.obtenerNombre()}`}
											className="rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700 transition-colors disabled:cursor-not-allowed disabled:bg-zinc-300"
										>
											Reagendar
										</button>
									</div>
								</article>
							);
						})}
					</div>
				) : (
					<div className="flex flex-col items-center justify-center py-10 px-4 text-center border border-dashed border-zinc-200 rounded-lg bg-zinc-50 flex-1">
						<span className="text-2xl mb-2" role="img" aria-label="Sin turnos">📅</span>
						<p className="text-sm font-medium text-zinc-500">
							No hay reservas programadas para este día
						</p>
					</div>
				)}
			</section>

			{turnoAReagendar !== null && (
				<section role="dialog" aria-modal="true" aria-labelledby="titulo-reagendar" className="fixed inset-0 z-10 flex items-center justify-center bg-black/30 p-4">
					<div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
						<h2 id="titulo-reagendar" className="text-lg font-semibold text-zinc-800">Reagendar evento</h2>
						<p className="mt-1 text-sm text-zinc-600">Seleccioná una nueva fecha y horario disponibles para {turnoAReagendar.obtenerNombre()}.</p>
						<label htmlFor="nuevo-horario" className="mt-4 block text-sm font-medium text-zinc-700">Nueva fecha y horario</label>
						<select id="nuevo-horario" value={fechaReagendada} onChange={(event) => setFechaReagendada(event.target.value)} className="mt-1 w-full rounded-md border border-zinc-300 p-2">
							{horariosDisponiblesReagendado.map((fecha) => (
								<option key={fecha.toISOString()} value={fecha.toISOString()}>{fecha.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}</option>
							))}
						</select>
						<div className="mt-5 flex justify-end gap-3">
							<button type="button" onClick={() => setTurnoAReagendar(null)} className="rounded-md px-3 py-2 text-sm font-medium text-zinc-700">Cancelar</button>
							<button type="button" onClick={confirmarReagendado} disabled={!fechaReagendada} className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-300">Confirmar nuevo horario</button>
						</div>
					</div>
				</section>
			)}
		</div>
	);
}
