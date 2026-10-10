import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CalendarioAdmin from '@/components/CalendarioAdmin';
import { Evento } from '@/domain/entities/evento';

// Fecha fija para que los tests sean deterministas.
const HOY = new Date(2026, 10, 15); // 15 de noviembre de 2026

// Datos de prueba de los casos CP-M05-009 y CP-M05-010.
const crearTurnos = () => ({
	pendiente: new Evento('E-01', 'pendiente', new Date(2026, 10, 20, 10, 0), 'Consulta inicial', '2615555555', 'Juan Perez'),
	cancelado: new Evento('E-02', 'cancelado', new Date(2026, 10, 20, 11, 0), 'Seguimiento', '2614444444', 'María López'),
	confirmado: new Evento('E-03', 'confirmado', new Date(2026, 10, 20, 12, 0), 'Control', '2613333333', 'Pedro Gómez'),
});

const seleccionarDia20 = async (user: ReturnType<typeof userEvent.setup>) => {
	const calendario = screen.getByRole('region', { name: 'Calendario de Administrador' });
	await user.click(within(calendario).getByRole('button', { name: '20, con reservas' }));
	return screen.getByRole('region', { name: 'Reservas del día' });
};

const tarjetaDe = (panel: HTMLElement, nombre: string) =>
	within(panel).getByRole('article', { name: `Turno de ${nombre}` });

describe('M05-US5 - Confirmar evento', () => {
	it('CP-M05-009: Al confirmar un evento "Pendiente" cambia a "Confirmado", se muestra el mensaje de éxito y desaparece la opción "Confirmar"', async () => {
		const user = userEvent.setup();
		const { pendiente } = crearTurnos();
		const onConfirmar = jest.fn();
		render(<CalendarioAdmin hoy={HOY} turnos={[pendiente]} onConfirmar={onConfirmar} />);

		// Paso 1: al seleccionar el día se lista el turno pendiente con su botón "Confirmar"
		const panel = await seleccionarDia20(user);
		const tarjeta = tarjetaDe(panel, 'Juan Perez');
		expect(within(tarjeta).getByText('10:00 hs')).toBeInTheDocument();
		expect(within(tarjeta).getByText('Pendiente')).toBeInTheDocument();
		expect(screen.queryByRole('status')).not.toBeInTheDocument();

		// Paso 2: clic en "Confirmar"
		await user.click(within(tarjeta).getByRole('button', { name: 'Confirmar turno de Juan Perez' }));

		expect(within(tarjeta).getByText('Confirmado')).toBeInTheDocument();
		expect(within(tarjeta).queryByText('Pendiente')).not.toBeInTheDocument();
		expect(screen.getByRole('status')).toHaveTextContent('Evento confirmado correctamente');
		expect(within(tarjeta).queryByRole('button', { name: /Confirmar/ })).not.toBeInTheDocument();
		expect(pendiente.obtenerEstado()).toBe('confirmado');
		// Se notifica la confirmación (punto de enganche para el email al invitado)
		expect(onConfirmar).toHaveBeenCalledWith(pendiente);
	});

	it('CP-M05-010: Un evento "Cancelado" no muestra la opción "Confirmar" y mantiene su estado', async () => {
		const user = userEvent.setup();
		const { cancelado } = crearTurnos();
		render(<CalendarioAdmin hoy={HOY} turnos={[cancelado]} />);

		// Paso 1: al seleccionar el día se lista el turno cancelado
		const panel = await seleccionarDia20(user);
		const tarjeta = tarjetaDe(panel, 'María López');
		expect(within(tarjeta).getByText('11:00 hs')).toBeInTheDocument();
		expect(within(tarjeta).getByText('Cancelado')).toBeInTheDocument();

		// Paso 2: no se ofrece la opción "Confirmar" y el estado no cambia
		expect(within(panel).queryByRole('button', { name: /Confirmar/ })).not.toBeInTheDocument();
		expect(screen.queryByRole('status')).not.toBeInTheDocument();
		expect(cancelado.obtenerEstado()).toBe('cancelado');
	});

	it('Escenario 2 (Confirmado): Un evento ya "Confirmado" tampoco muestra la opción "Confirmar"', async () => {
		const user = userEvent.setup();
		const { confirmado } = crearTurnos();
		render(<CalendarioAdmin hoy={HOY} turnos={[confirmado]} />);

		const panel = await seleccionarDia20(user);
		const tarjeta = tarjetaDe(panel, 'Pedro Gómez');
		expect(within(tarjeta).getByText('Confirmado')).toBeInTheDocument();
		expect(within(panel).queryByRole('button', { name: /Confirmar/ })).not.toBeInTheDocument();
	});

	it('En un día con varios turnos solo se ofrece "Confirmar" para el pendiente, y al cambiar de día se oculta el mensaje de éxito', async () => {
		const user = userEvent.setup();
		const { pendiente, cancelado, confirmado } = crearTurnos();
		render(<CalendarioAdmin hoy={HOY} turnos={[pendiente, cancelado, confirmado]} />);

		const panel = await seleccionarDia20(user);
		const botones = within(panel).getAllByRole('button', { name: /Confirmar/ });
		expect(botones).toHaveLength(1);
		expect(botones[0]).toHaveAccessibleName('Confirmar turno de Juan Perez');

		await user.click(botones[0]);
		expect(screen.getByRole('status')).toHaveTextContent('Evento confirmado correctamente');

		const calendario = screen.getByRole('region', { name: 'Calendario de Administrador' });
		await user.click(within(calendario).getByRole('button', { name: '21' }));
		expect(screen.queryByRole('status')).not.toBeInTheDocument();
	});
});
