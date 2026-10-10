export type EstadoEvento =
  | "pendiente"
  | "confirmado"
  | "cancelado"
  | "completado";

export interface DatosCompletarEvento {
  eventoId: string;
  estadoActual: EstadoEvento;
  fechaEvento: Date;
  ahora?: Date;
}

export interface ResultadoCompletarEvento {
  exito: boolean;
  mensaje: string;
  nuevoEstado: "completado";
  completadoEn: Date;
  editable: boolean;
  cancelable: boolean;
}

export function puedeCompletarse(
  estadoActual: EstadoEvento,
  fechaEvento: Date,
  ahora: Date = new Date()
): boolean {
  return estadoActual === "confirmado" && fechaEvento.getTime() <= ahora.getTime();
}

export function completarEventoManualmente(
  datos: DatosCompletarEvento
): ResultadoCompletarEvento {
  const ahora = datos.ahora ?? new Date();

  if (!datos.eventoId || datos.eventoId.trim() === "") {
    throw new Error("El ID del evento es obligatorio para completarlo");
  }

  if (datos.estadoActual !== "confirmado") {
    throw new Error("Solo se pueden completar eventos en estado confirmado");
  }

  if (datos.fechaEvento.getTime() > ahora.getTime()) {
    throw new Error(
      "No se puede completar un evento cuya fecha aún no ocurre"
    );
  }

  return {
    exito: true,
    mensaje: "Evento completado correctamente",
    nuevoEstado: "completado",
    completadoEn: ahora,
    editable: false,
    cancelable: false,
  };
}