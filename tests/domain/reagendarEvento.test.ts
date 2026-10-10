import { Evento } from '@/domain/entities/evento';

describe('M05-US3 - Reagendar evento', () => {
	it('Escenario 1: permite cambiar la fecha y hora de un evento pendiente', () => {
		const evento = new Evento('E-04', 'pendiente', new Date(2026, 10, 20, 10, 0));
		const nuevaFecha = new Date(2026, 10, 22, 15, 30);

		expect(evento.puedeReagendarse()).toBe(true);
		evento.reagendar(nuevaFecha);

		expect(evento.obtenerFechaHora()).toEqual(nuevaFecha);
	});

	it.each(['en_curso', 'completado'])('Escenario 2: no permite reagendar un evento %s', (estado) => {
		const fechaOriginal = new Date(2026, 10, 20, 10, 0);
		const evento = new Evento('E-05', estado, fechaOriginal);

		expect(evento.puedeReagendarse()).toBe(false);
		expect(() => evento.reagendar(new Date(2026, 10, 22, 15, 30)))
			.toThrow('No se puede reagendar un evento en curso, completado o cancelado');
		expect(evento.obtenerFechaHora()).toEqual(fechaOriginal);
	});
});
