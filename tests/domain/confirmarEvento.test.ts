import { Evento } from '@/domain/entities/evento';

const FECHA_TURNO = new Date(2026, 10, 20, 10, 0); // 20/11/2026 10:00

const crearEvento = (estado: string) =>
	new Evento('E-01', estado, FECHA_TURNO, 'Consulta inicial', '2615555555', 'Juan Perez');

describe('M05-US5 - Confirmar evento (dominio)', () => {
	it('Escenario 1: Un evento "pendiente" pasa a estado "confirmado" al confirmarlo', () => {
		const evento = crearEvento('pendiente');

		expect(evento.puedeConfirmarse()).toBe(true);
		evento.confirmar();

		expect(evento.obtenerEstado()).toBe('confirmado');
		expect(evento.puedeConfirmarse()).toBe(false);
	});

	it.each(['confirmado', 'cancelado', 'completado'])(
		'Escenario 2: Un evento "%s" no puede confirmarse y conserva su estado',
		(estado) => {
			const evento = crearEvento(estado);

			expect(evento.puedeConfirmarse()).toBe(false);
			expect(() => evento.confirmar()).toThrow('Solo se pueden confirmar eventos pendientes');
			expect(evento.obtenerEstado()).toBe(estado);
		}
	);
});
