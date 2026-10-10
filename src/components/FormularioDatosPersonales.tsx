'use client';

import { useState } from 'react';

export interface DatosPersonales {
	nombre: string;
	email: string;
	telefono?: string;
	nota?: string;
	modalidad?: 'presencial' | 'virtual';
}

export interface FormularioDatosPersonalesProps {
	onSubmit: (datos: DatosPersonales) => void;
	onCancel?: () => void;
	mostrarModalidad?: boolean;
}

export default function FormularioDatosPersonales({ onSubmit, onCancel, mostrarModalidad = false }: FormularioDatosPersonalesProps) {
	const [nombre, setNombre] = useState('');
	const [email, setEmail] = useState('');
	const [telefono, setTelefono] = useState('');
	const [nota, setNota] = useState('');
	const [modalidad, setModalidad] = useState<'presencial' | 'virtual'>('presencial');

	const [errores, setErrores] = useState<{ nombre?: string; email?: string }>({});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const nuevosErrores: { nombre?: string; email?: string } = {};

		if (!nombre.trim()) {
			nuevosErrores.nombre = 'Campo obligatorio';
		} else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/.test(nombre)) {
			nuevosErrores.nombre = 'Usa el formato solicitado: Solo se permiten letras y espacios';
		}

		if (!email.trim()) {
			nuevosErrores.email = 'Campo obligatorio';
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			nuevosErrores.email = 'Introduce una dirección de correo electrónico válida';
		}

		if (Object.keys(nuevosErrores).length > 0) {
			setErrores(nuevosErrores);
			return;
		}

		setErrores({});
		onSubmit({
			nombre,
			email,
			telefono: telefono.trim(),
			nota: nota.trim(),
			...(mostrarModalidad ? { modalidad } : {}),
		});
	};

	const handleCancel = () => {
    	setNombre('');
    	setEmail('');
    	setTelefono('');
    	setNota('');
    	setErrores({});
    	if (onCancel) onCancel();
  	};

	return (
		<form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 p-4 border rounded-xl bg-white max-w-sm">
			<div className="flex flex-col gap-1">
				<label htmlFor="nombre" className="text-sm font-medium text-zinc-700">Nombre completo *</label>
				<input
					id="nombre"
					type="text"
					value={nombre}
					onChange={(e) => setNombre(e.target.value)}
					aria-invalid={!!errores.nombre}
					className="border border-zinc-300 rounded-md p-2 text-zinc-900"
				/>
				{errores.nombre && <p role="alert" className="text-xs text-red-600">{errores.nombre}</p>}
			</div>

			<div className="flex flex-col gap-1">
				<label htmlFor="email" className="text-sm font-medium text-zinc-700">Correo electrónico *</label>
				<input
					id="email"
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					aria-invalid={!!errores.email}
					className="border border-zinc-300 rounded-md p-2 text-zinc-900"
				/>
				{errores.email && <p role="alert" className="text-xs text-red-600">{errores.email}</p>}
			</div>

			<div className="flex flex-col gap-1">
				<label htmlFor="telefono" className="text-sm font-medium text-zinc-700">Teléfono (opcional)</label>
				<input
					id="telefono"
					type="tel"
					value={telefono}
					onChange={(e) => setTelefono(e.target.value)}
					className="border border-zinc-300 rounded-md p-2 text-zinc-900"
				/>
			</div>

			{mostrarModalidad && (
				<div className="flex flex-col gap-1">
					<label htmlFor="modalidad" className="text-sm font-medium text-zinc-700">Modalidad</label>
					<select
						id="modalidad"
						value={modalidad}
						onChange={(e) => setModalidad(e.target.value as 'presencial' | 'virtual')}
						className="border border-zinc-300 rounded-md p-2 text-zinc-900"
					>
						<option value="presencial">Presencial</option>
						<option value="virtual">Virtual</option>
					</select>
				</div>
			)}

			<div className="flex flex-col gap-1">
        		<label htmlFor="nota" className="text-sm font-medium text-zinc-700">Nota para el administrador (opcional)</label>
        		<textarea
          			id="nota"
          		value={nota}
          		onChange={(e) => setNota(e.target.value)}
          		rows={3}
          		className="border border-zinc-300 rounded-md p-2 text-zinc-900 resize-vertical"
          		placeholder="Ej: Prefiero atención virtual, necesito silla de ruedas, etc."
        		/>
      		</div>

			<div className="flex gap-2 mt-2">
				<button
          			type="button"
          			onClick={handleCancel}
          			className="flex-1 rounded-md border border-zinc-300 py-2 font-medium text-zinc-700 hover:bg-zinc-50"
        		>
          			Cancelar
        		</button>
        		<button
          			type="submit"
          			className="flex-1 rounded-md bg-indigo-600 py-2 font-medium text-white hover:bg-indigo-700"
        		>
          			Continuar
        		</button>
      		</div>
		</form>
	);
}
