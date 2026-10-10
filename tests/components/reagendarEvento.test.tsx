import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CalendarioAdmin from '@/components/CalendarioAdmin';
import { Evento } from '@/domain/entities/evento';

const HOY = new Date(2026, 10, 15);
const FECHA_ORIGINAL = new Date(2026, 10, 20, 10, 0);
const NUEVA_FECHA = new Date(2026, 10, 22, 15, 30);

const seleccionarDia = async (user: ReturnType<typeof userEvent.setup>, dia: number, conReservas = true) => {
	const calendario = screen.getByRole('region', { name: 'Calendario de Administrador' });
	await user.click(within(calendario).getByRole('button', { name: conReservas ? `${dia}, con reservas` : `${dia}` }));
	return screen.getByRole('region', { name: 'Reservas del día' });
};

describe('M05-US3 - Reagendar evento', () => {
	it('CP-M05-013: muestra horarios disponibles, reagenda el evento y notifica el cambio', async () => {
		const user = userEvent.setup();
		const evento = new Evento('E-04', 'pendiente', FECHA_ORIGINAL, 'Consulta inicial', '2615555555', 'Juan Perez');
		const onReagendar = jest.fn();
		render(<CalendarioAdmin hoy={HOY} turnos={[evento]} horariosDisponiblesReagendado={[NUEVA_FECHA]} onReagendar={onReagendar} />);

		const panel = await seleccionarDia(user, 20);
		const tarjeta = within(panel).getByRole('article', { name: 'Turno de Juan Perez' });
		await user.click(within(tarjeta).getByRole('button', { name: 'Reagendar turno de Juan Perez' }));

		const dialogo = screen.getByRole('dialog', { name: 'Reagendar evento' });
		expect(within(dialogo).getByLabelText('Nueva fecha y horario')).toHaveValue(NUEVA_FECHA.toISOString());
		await user.click(within(dialogo).getByRole('button', { name: 'Confirmar nuevo horario' }));

		expect(evento.obtenerFechaHora()).toEqual(NUEVA_FECHA);
		expect(onReagendar).toHaveBeenCalledWith(evento);
		expect(screen.getByRole('status')).toHaveTextContent('Evento reagendado correctamente');
		expect(within(panel).queryByRole('article', { name: 'Turno de Juan Perez' })).not.toBeInTheDocument();

		const panelNuevaFecha = await seleccionarDia(user, 22, true);
		expect(within(panelNuevaFecha).getByText('15:30 hs')).toBeInTheDocument();
	});

	it('Escenario 2: deshabilita el reagendado de un evento en curso o completado', async () => {
		const user = userEvent.setup();
		const enCurso = new Evento('E-05', 'en_curso', FECHA_ORIGINAL, '', '', 'María López');
		const completado = new Evento('E-06', 'completado', new Date(2026, 10, 20, 11, 0), '', '', 'Pedro Gómez');
		render(<CalendarioAdmin hoy={HOY} turnos={[enCurso, completado]} horariosDisponiblesReagendado={[NUEVA_FECHA]} />);

		const panel = await seleccionarDia(user, 20);
		expect(within(panel).getByRole('button', { name: 'Reagendar turno de María López' })).toBeDisabled();
		expect(within(panel).getByRole('button', { name: 'Reagendar turno de Pedro Gómez' })).toBeDisabled();
		expect(enCurso.obtenerFechaHora()).toEqual(FECHA_ORIGINAL);
		expect(completado.obtenerFechaHora()).toEqual(new Date(2026, 10, 20, 11, 0));
	});
});
