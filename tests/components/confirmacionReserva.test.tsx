import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmacionReserva from '@/components/ConfirmacionReserva';
import SeleccionEvento from '@/components/SeleccionEvento';
import Home from '@/app/page';
import type { Reserva } from '@/domain/services/editarReserva';
import { ReservaEnMemoria } from '@/infrastructure/repositories/reservaEnMemoria';
import { crearProfesionalMock } from '@/lib/mockProfesional';

const reservaBase: Reserva = {
	id: 'res-123',
	estado: 'en_proceso',
	datos: {
		profesional: 'Dra. Ana Pérez',
		especialidad: 'Medicina general',
		tipoConsulta: 'Consulta inicial',
		duracion: 30,
		fecha: '2099-12-01',
		horario: '10:00',
		descripcion: 'Primera visita',
		modalidad: 'virtual',
		pacienteNombre: 'María López',
		pacienteEmail: 'maria@example.com',
		pacienteTelefono: '',
	},
};

describe('ConfirmacionReserva - MO4_US3 y MO4_US4', () => {
	it('muestra el resumen completo y confirma una reserva correctamente', async () => {
		const user = userEvent.setup();
		const onConfirmada = jest.fn();
		render(<ConfirmacionReserva reserva={reservaBase} onConfirmada={onConfirmada} />);

		expect(screen.getByText('Dra. Ana Pérez')).toBeInTheDocument();
		expect(screen.getByText('Medicina general')).toBeInTheDocument();
		expect(screen.getByText('Consulta inicial')).toBeInTheDocument();
		expect(screen.getByText('30 minutos')).toBeInTheDocument();
		expect(screen.getByText('2099-12-01')).toBeInTheDocument();
		expect(screen.getByText('10:00')).toBeInTheDocument();
		expect(screen.getByText('Primera visita')).toBeInTheDocument();
		expect(screen.getByText('virtual')).toBeInTheDocument();
		expect(screen.getByText('María López')).toBeInTheDocument();
		expect(screen.getByText('maria@example.com')).toBeInTheDocument();
		expect(screen.getByText('No informado')).toBeInTheDocument();

		await user.click(screen.getByRole('button', { name: 'Confirmar reserva' }));

		expect(screen.getByRole('status')).toHaveTextContent('Turno registrado exitosamente');
		expect(onConfirmada).toHaveBeenCalledWith(
			expect.objectContaining({ exito: true, mensaje: 'Turno registrado exitosamente' }),
			reservaBase
		);
	});

	it('muestra el diálogo de cancelación y no ejecuta nada al volver', async () => {
		const user = userEvent.setup();
		const onCancelada = jest.fn();
		render(<ConfirmacionReserva reserva={reservaBase} onCancelada={onCancelada} />);

		await user.click(screen.getByRole('button', { name: 'Cancelar reserva' }));
		expect(screen.getByRole('dialog')).toBeInTheDocument();

		await user.click(screen.getByRole('button', { name: 'Volver' }));
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		expect(onCancelada).not.toHaveBeenCalled();

		await user.click(screen.getByRole('button', { name: 'Cancelar reserva' }));
		await user.click(screen.getByRole('button', { name: 'Confirmar cancelación' }));
		expect(onCancelada).toHaveBeenCalledWith(reservaBase);
	});
});

describe('Disponibilidad de reservas en memoria', () => {
	it('libera el horario cancelado para que vuelva a estar disponible', async () => {
		const user = userEvent.setup();
		const repositorio = new ReservaEnMemoria();
		const profesional = crearProfesionalMock(new Date(2026, 5, 17));
		const datos = { profesional: profesional.nombre, fecha: '2026-06-18', horario: '09:00' };
		const turno = repositorio.registrarTurno('res-123', { ...reservaBase.datos, ...datos });

		expect(repositorio.estaOcupado(datos)).toBe(true);
		repositorio.cancelarTurno(turno.id);
		expect(repositorio.estaOcupado(datos)).toBe(false);

		render(
			<SeleccionEvento
				profesional={profesional}
				hoy={new Date(2026, 5, 17)}
				horariosNoDisponibles={repositorio.obtenerHorariosOcupados()}
			/>
		);

		await user.click(screen.getByRole('button', { name: /Consulta inicial/ }));
		const calendario = screen.getByRole('region', { name: 'Calendario' });
		await user.click(within(calendario).getByRole('button', { name: '18' }));
		expect(within(screen.getByRole('region', { name: 'Horarios disponibles' })).getByRole('button', { name: '09:00' })).toBeEnabled();
	});
});

describe('Flujo de confirmación y cancelación desde la página', () => {
	it('mantiene confirmado el turno y muestra el error si se intenta cancelarlo después', async () => {
		const user = userEvent.setup();
		const mañana = new Date();
		mañana.setDate(mañana.getDate() + 1);

		render(<Home />);
		await user.click(screen.getByRole('button', { name: /Consulta inicial/ }));
		await user.click(within(screen.getByRole('region', { name: 'Calendario' })).getByRole('button', { name: String(mañana.getDate()) }));
		await user.click(within(screen.getByRole('region', { name: 'Horarios disponibles' })).getByRole('button', { name: '09:00' }));

		await user.type(screen.getByLabelText('Nombre completo *'), 'María López');
		await user.type(screen.getByLabelText('Correo electrónico *'), 'maria@example.com');
		await user.click(screen.getByRole('button', { name: 'Continuar' }));
		await user.click(screen.getByRole('button', { name: 'Confirmar reserva' }));

		expect(screen.getByRole('status')).toHaveTextContent('Turno registrado exitosamente');
		await user.click(screen.getByRole('button', { name: 'Cancelar reserva' }));
		await user.click(screen.getByRole('button', { name: 'Confirmar cancelación' }));

		expect(screen.getByRole('alert')).toHaveTextContent(
			'No se puede cancelar una reserva que ya se encuentra confirmada desde esta pantalla'
		);
		expect(screen.getByRole('region', { name: 'Confirmación de reserva' })).toBeInTheDocument();
		expect(screen.getByRole('status')).toHaveTextContent('Turno registrado exitosamente');
	});
});
