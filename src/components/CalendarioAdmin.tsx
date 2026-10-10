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
	// M05-US02: notifica la cancelación (punto de enganche para liberar el slot en otros sistemas)
	onCancelar?: (turno: Evento, motivo: string) => void;
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

// M05-US02: solo una reserva activa (pendiente o confirmada) puede cancelarse.
const esReservaActiva = (estado: string): boolean => estado === 'pendiente' || estado === 'confirmado';

// M05-US02 (Escenario 3): las reservas de fechas ya transcurridas no se pueden cancelar.
const esFechaPasada = (turno: Evento, fechaHoy: Date): boolean =>
	aSoloDia(turno.obtenerFechaHora()).getTime() < fechaHoy.getTime();

const horaDe = (turno: Evento): string =>
	String(turno.obtenerFechaHora().getHours()).padStart(2, '0') + ':' +
	String(turno.obtenerFechaHora().getMinutes()).padStart(2, '0');

export default function CalendarioAdmin({ hoy, reservas = [], turnos = [], onSeleccionarDia, onConfirmar, onCancelar }: Props) {
	const fechaHoy = useMemo(() => aSoloDia(hoy ?? new Date()), [hoy]);
	
	// El mes/año visible se inicializa con el mes de fechaHoy
	const [mesVisible, setMesVisible] = useState(() => new Date(fechaHoy.getFullYear(), fechaHoy.getMonth(), 1));
	
	// El día seleccionado por defecto es hoy (representado como ISO string)
	const [fechaSeleccionada, setFechaSeleccionada] = useState<string>(() => aISO(fechaHoy));

	// Id del último evento confirmado, para mostrar el mensaje de éxito (M05-US5).
	// Se guarda el id (y no el texto) para forzar el re-render en cada confirmación.
	const [ultimoConfirmado, setUltimoConfirmado] = useState<string | null>(null);

	// M05-US02: reserva seleccionada para cancelar, motivo tipeado en el modal y última cancelación exitosa.
	const [turnoAEliminar, setTurnoAEliminar] = useState<Evento | null>(null);
	const [motivo, setMotivo] = useState('');
	const [ultimoCancelado, setUltimoCancelado] = useState<string | null>(null);

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
	const diasConReservas = useMemo(() => {
		if (turnos && turnos.length > 0) {
			return Array.from(new Set(turnos.map((t) => aISO(t.obtenerFechaHora()))));
		}
		return reservas;
	}, [turnos, reservas]);

	// Turnos correspondientes al día seleccionado, ordenados cronológicamente
	const turnosDelDia = useMemo(() => {
		return turnos
			.filter((t) => aISO(t.obtenerFechaHora()) === fechaSeleccionada)
			.sort((a, b) => a.obtenerFechaHora().getTime() - b.obtenerFechaHora().getTime());
	}, [turnos, fechaSeleccionada]);

	const seleccionarDia = (dia: number) => {
		const fecha = new Date(anioVisible, mesVisibleIndex, dia);
		const iso = aISO(fecha);
		setFechaSeleccionada(iso);
		setUltimoConfirmado(null);
		setUltimoCancelado(null);
		if (onSeleccionarDia) {
			onSeleccionarDia(fecha);
		}
	};

	const confirmarTurno = (turno: Evento) => {
		turno.confirmar();
		setUltimoConfirmado(turno.obtenerId());
		setUltimoCancelado(null);
		if (onConfirmar) {
			onConfirmar(turno);
		}
	};

	// M05-US02 (Escenario 2): abrir el modal con el campo opcional de motivo.
	const abrirModalCancelacion = (turno: Evento) => {
		setTurnoAEliminar(turno);
		setMotivo('');
	};

	const cerrarModalCancelacion = () => {
		setTurnoAEliminar(null);
		setMotivo('');
	};

	// M05-US02 (Escenario 1): al confirmar, la reserva pasa a "Cancelada" y el horario queda libre.
	const confirmarCancelacion = () => {
		if (!turnoAEliminar) return;
		const reserva = turnoAEliminar;
		reserva.cancelarEvento();
		setUltimoCancelado(reserva.obtenerId());
		setUltimoConfirmado(null);
		if (onCancelar) {
			onCancelar(reserva, motivo.trim());
		}
		setTurnoAEliminar(null);
		setMotivo('');
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

			{/* M05-US02 (Escenario 1): mensaje de cancelación exitosa */}
			{ultimoCancelado !== null && (
				<p role="status" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
					Reserva cancelada correctamente. El horario quedó disponible.
				</p>
			)}
				
				{turnosDelDia.length > 0 ? (
					<div className="flex flex-col gap-3 overflow-y-auto max-h-[350px] pr-1">
						{turnosDelDia.map((turno) => {
							const hora = horaDe(turno);
							const estado = turno.obtenerEstado();
							const pasada = esFechaPasada(turno, fechaHoy);
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
									<div className="flex justify-between items-center pt-1 gap-2">
										<span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${COLORES_ESTADO[estado] ?? 'bg-zinc-100 text-zinc-700'}`}>
											{ETIQUETAS_ESTADO[estado] ?? estado}
										</span>
										{/* M05-US5: la opción solo se muestra para eventos pendientes */}
										<div className="flex gap-2">
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
											{/* M05-US02: la opción se ofrece en reservas activas; deshabilitada en fechas pasadas */}
											{esReservaActiva(estado) && (
												<button
													type="button"
													onClick={() => abrirModalCancelacion(turno)}
													disabled={pasada}
													aria-label={`Cancelar turno de ${turno.obtenerNombre()}`}
													title={pasada ? 'No se pueden cancelar reservas de fechas pasadas' : undefined}
													className="rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
												>
													Cancelar
												</button>
											)}
										</div>
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

			{/* M05-US02 (Escenario 2): modal con campo opcional de motivo, máximo 200 caracteres */}
			{turnoAEliminar && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
					<div
						role="dialog"
						aria-modal="true"
						aria-labelledby="titulo-cancelar-reserva"
						className="flex w-full max-w-sm flex-col gap-3 rounded-xl bg-white p-5 shadow-lg"
					>
						<h3 id="titulo-cancelar-reserva" className="text-lg font-semibold text-zinc-800">
							Cancelar reserva
						</h3>
						<p className="text-sm text-zinc-600">
							<span className="font-medium text-zinc-800">{turnoAEliminar.obtenerNombre()}</span> — {horaDe(turnoAEliminar)} hs
						</p>
						<label htmlFor="motivo-cancelacion" className="text-sm font-medium text-zinc-700">
							Motivo de cancelación (opcional)
						</label>
						<textarea
							id="motivo-cancelacion"
							rows={3}
							maxLength={200}
							value={motivo}
							onChange={(e) => setMotivo(e.target.value)}
							className="resize-none rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
							placeholder="Máximo 200 caracteres"
						/>
						<p className="text-xs text-zinc-500">{motivo.length} de 200 caracteres</p>
						<div className="flex justify-end gap-2 pt-1">
							<button
								type="button"
								onClick={cerrarModalCancelacion}
								className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors"
							>
								Volver
							</button>
							<button
								type="button"
								onClick={confirmarCancelacion}
								className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
							>
								Confirmar cancelación
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
