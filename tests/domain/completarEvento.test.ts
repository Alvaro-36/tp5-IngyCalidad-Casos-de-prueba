import {
  completarEventoManualmente,
  puedeCompletarse,
} from "@/domain/services/completarEvento";

const AHORA = new Date(2026, 10, 21, 9, 0); 

describe("completarEventoManualmente (M05-US7)", () => {
  it("CP-M05-011 - Escenario 1: completa un evento 'confirmado' de fecha pasada", () => {
    const resultado = completarEventoManualmente({
      eventoId: "E-03",
      estadoActual: "confirmado",
      fechaEvento: new Date(2026, 10, 20, 12, 0), 
      ahora: AHORA,
    });

    expect(resultado.exito).toBe(true);
    expect(resultado.mensaje).toBe("Evento completado correctamente");
    expect(resultado.nuevoEstado).toBe("completado");
    expect(resultado.completadoEn).toEqual(AHORA);
    expect(resultado.editable).toBe(false);
    expect(resultado.cancelable).toBe(false);
  });

  it("CP-M05-012 - Escenario 3: falla si el evento 'confirmado' es de fecha futura", () => {
    expect(() =>
      completarEventoManualmente({
        eventoId: "E-04",
        estadoActual: "confirmado",
        fechaEvento: new Date(2026, 10, 25, 12, 0),
        ahora: AHORA,
      })
    ).toThrow("No se puede completar un evento cuya fecha aún no ocurre");
  });

  it("falla si el evento no está en estado 'confirmado'", () => {
    expect(() =>
      completarEventoManualmente({
        eventoId: "E-05",
        estadoActual: "cancelado",
        fechaEvento: new Date(2026, 10, 20, 12, 0),
        ahora: AHORA,
      })
    ).toThrow("Solo se pueden completar eventos en estado confirmado");
  });

  it("falla si no se proporciona el ID del evento", () => {
    expect(() =>
      completarEventoManualmente({
        eventoId: "  ",
        estadoActual: "confirmado",
        fechaEvento: new Date(2026, 10, 20, 12, 0),
        ahora: AHORA,
      })
    ).toThrow("El ID del evento es obligatorio para completarlo");
  });
});

describe("puedeCompletarse (botón 'Completar')", () => {
  it("habilitado para confirmado + fecha pasada", () => {
    expect(
      puedeCompletarse("confirmado", new Date(2026, 10, 20, 12, 0), AHORA)
    ).toBe(true);
  });

  it("deshabilitado para confirmado + fecha futura", () => {
    expect(
      puedeCompletarse("confirmado", new Date(2026, 10, 25, 12, 0), AHORA)
    ).toBe(false);
  });

  it("deshabilitado para pendiente, cancelado y completado", () => {
    const pasada = new Date(2026, 10, 20, 12, 0);
    expect(puedeCompletarse("pendiente", pasada, AHORA)).toBe(false);
    expect(puedeCompletarse("cancelado", pasada, AHORA)).toBe(false);
    expect(puedeCompletarse("completado", pasada, AHORA)).toBe(false);
  });
});