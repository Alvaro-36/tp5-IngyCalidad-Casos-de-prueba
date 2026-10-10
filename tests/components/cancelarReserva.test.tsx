import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CalendarioAdmin from '@/components/CalendarioAdmin';
import { Evento } from '@/domain/entities/evento';

// Fecha fija para que los tests sean deterministas.
const HOY = new Date(2026, 10, 15); // 15 de noviembre de 2026

// Datos de prueba de los casos CP-M05-011 y CP-M05-012.
const crearTurnos = () => ({
	futuro: new Evento('E-11', 'confirmado', new Date(2026, 10, 25, 15, 0), 'Renovación de receta', '2613333333', 'Ana Torres'),
	pasado: new Evento('E-12', 'confirmado', new Date(2026, 9, 1, 9, 0), 'Control mensual', '2612222222', 'Luis Gómez'),
});

const seleccionarDia = async (user: ReturnType<typeof userEvent.setup>, nombreDia: string) => {
	const calendario = screen.getByRole('region', { name: 'Calendario de Administrador' });
	await user.click(within(calendario).getByRole('button', { name: nombreDia }));
	return screen.getByRole('region', { name: 'Reservas del día' });
};

const tarjetaDe = (panel: HTMLElement, nombre: string) =>
	within(panel).getByRole('article', { name: `Turno de ${nombre}` });

describe('M05-US02 - Cancelar reserva', () => {
	it('CP-M05-011: Al cancelar una reserva activa se abre el modal, cambia a "Cancelada" y el horario queda disponible', async () => {
		const user = userEvent.setup();
		const { futuro } = crearTurnos();
		const onCancelar = jest.fn();
		render(<CalendarioAdmin hoy={HOY} turnos={[futuro]} onCancelar={onCancelar} />);

		// Paso 1: al seleccionar el día se lista la reserva activa con su botón "Cancelar"
		const panel = await seleccionarDia(user, '25, con reservas');
		const tarjeta = tarjetaDe(panel, 'Ana Torres');
		expect(within(tarjeta).getByText('Confirmado')).toBeInTheDocument();
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		expect(screen.queryByRole('status')).not.toBeInTheDocument();
		const botonCancelar = within(tarjeta).getByRole('button', { name: 'Cancelar turno de Ana Torres' });
		expect(botonCancelar).toBeEnabled();

		// Paso 2: al pulsar "Cancelar" se despliega el modal con el campo opcional de motivo
		await user.click(botonCancelar);
		const dialogo = screen.getByRole('dialog', { name: 'Cancelar reserva' });
		expect(within(dialogo).getByLabelText(/Motivo de cancelación/)).toBeInTheDocument();
		expect(within(dialogo).getByRole('button', { name: 'Volver' })).toBeInTheDocument();
		expect(within(dialogo).getByRole('button', { name: 'Confirmar cancelación' })).toBeInTheDocument();

		// Paso 3: se ingresa el motivo y se confirma la cancelación
		await user.type(within(dialogo).getByLabelText(/Motivo de cancelación/), 'El paciente no puede asistir');
		await user.click(within(dialogo).getByRole('button', { name: 'Confirmar cancelación' }));

		// Paso 4: el modal se cierra, la reserva queda "Cancelada" y el horario liberado
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		expect(screen.getByRole('status')).toHaveTextContent('Reserva cancelada correctamente. El horario quedó disponible.');
		expect(within(tarjeta).getByText('Cancelado')).toBeInTheDocument();
		expect(within(tarjeta).queryByText('Confirmado')).not.toBeInTheDocument();
		expect(futuro.obtenerEstado()).toBe('cancelado');
		expect(onCancelar).toHaveBeenCalledWith(futuro, 'El paciente no puede asistir');
		// Una reserva ya cancelada deja de ofrecer la opción "Cancelar"
		expect(within(tarjeta).queryByRole('button', { name: /Cancelar turno de/ })).not.toBeInTheDocument();
	});

	it('CP-M05-011 (variante): El motivo es opcional y está limitado a 200 caracteres, y "Volver" cierra el modal sin cancelar', async () => {
		const user = userEvent.setup();
		const { futuro } = crearTurnos();
		// Sin la prop onCancelar: la cancelación no depende de ningún enganche externo
		render(<CalendarioAdmin hoy={HOY} turnos={[futuro]} />);

		const panel = await seleccionarDia(user, '25, con reservas');
		const tarjeta = tarjetaDe(panel, 'Ana Torres');
		const botonCancelar = within(tarjeta).getByRole('button', { name: 'Cancelar turno de Ana Torres' });

		// Paso 1: el modal limita el motivo a 200 caracteres
		await user.click(botonCancelar);
		expect(screen.getByRole('dialog', { name: 'Cancelar reserva' })).toBeInTheDocument();
		expect(screen.getByLabelText(/Motivo de cancelación/)).toHaveAttribute('maxlength', '200');

		// Paso 2: "Volver" cierra el modal y no cancela nada
		await user.click(screen.getByRole('button', { name: 'Volver' }));
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		expect(screen.queryByRole('status')).not.toBeInTheDocument();
		expect(futuro.obtenerEstado()).toBe('confirmado');

		// Paso 3: se reabre y se confirma sin motivo (el campo es opcional)
		await user.click(within(tarjeta).getByRole('button', { name: 'Cancelar turno de Ana Torres' }));
		await user.click(screen.getByRole('button', { name: 'Confirmar cancelación' }));

		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		expect(screen.getByRole('status')).toHaveTextContent('Reserva cancelada correctamente');
		expect(futuro.obtenerEstado()).toBe('cancelado');
	});

	it('CP-M05-012: Una reserva de fecha pasada muestra el botón "Cancelar" deshabilitado y no puede cancelarse', async () => {
		const user = userEvent.setup();
		const { pasado } = crearTurnos();
		const onCancelar = jest.fn();
		render(<CalendarioAdmin hoy={HOY} turnos={[pasado]} onCancelar={onCancelar} />);

		// Paso 1: navegar al mes anterior (octubre 2026) y seleccionar el día 1
		const calendario = screen.getByRole('region', { name: 'Calendario de Administrador' });
		await user.click(within(calendario).getByRole('button', { name: 'Mes anterior' }));
		expect(within(calendario).getByText(/octubre 2026/i)).toBeInTheDocument();

		const panel = await seleccionarDia(user, '1, con reservas');
		const tarjeta = tarjetaDe(panel, 'Luis Gómez');
		expect(within(tarjeta).getByText('Confirmado')).toBeInTheDocument();

		// Paso 2: el botón "Cancelar" existe pero está deshabilitado por ser una fecha pasada
		const botonCancelar = within(tarjeta).getByRole('button', { name: 'Cancelar turno de Luis Gómez' });
		expect(botonCancelar).toBeDisabled();

		// Paso 3: el intento de cancelación no tiene ningún efecto
		fireEvent.click(botonCancelar);
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		expect(screen.queryByRole('status')).not.toBeInTheDocument();
		expect(pasado.obtenerEstado()).toBe('confirmado');
		expect(onCancelar).not.toHaveBeenCalled();
	});
});
