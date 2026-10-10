import type { DatosReserva } from '@/domain/services/reserva';

export interface TurnoConfirmado {
  id: string;
  datos: DatosReserva;
}

function claveHorario(datos: Pick<DatosReserva, 'profesional' | 'fecha' | 'horario'>): string {
  return `${datos.profesional}|${datos.fecha}|${datos.horario}`;
}

export class ReservaEnMemoria {
  private readonly turnos = new Map<string, TurnoConfirmado>();
  private readonly horariosOcupados = new Set<string>();

  registrarTurno(id: string, datos: DatosReserva): TurnoConfirmado {
    const turno = { id, datos: { ...datos } };
    this.turnos.set(id, turno);
    this.horariosOcupados.add(claveHorario(datos));
    return turno;
  }

  cancelarTurno(id: string): boolean {
    const turno = this.turnos.get(id);
    if (!turno) {
      return false;
    }

    this.turnos.delete(id);
    this.horariosOcupados.delete(claveHorario(turno.datos));
    return true;
  }

  estaOcupado(datos: Pick<DatosReserva, 'profesional' | 'fecha' | 'horario'>): boolean {
    return this.horariosOcupados.has(claveHorario(datos));
  }

  obtenerTurnos(): TurnoConfirmado[] {
    return [...this.turnos.values()];
  }

  obtenerHorariosOcupados(): ReadonlySet<string> {
    return new Set(this.horariosOcupados);
  }
}