# Casos de prueba – M05-US5 "Confirmar evento"

Autor: Wuilloud, Ignacio

> Historia de usuario: *Como administrador, quiero confirmar un evento solicitado manualmente
> de modo que el turno quede aprobado en mi agenda y el usuario invitado reciba la confirmación
> para asistir.*
>
> - Escenario 1 – Confirmación exitosa: al seleccionar un evento "Pendiente" y confirmar, cambia a
>   "Confirmado", se muestra mensaje de éxito y se envía email.
> - Escenario 2 – Acción sobre evento ya gestionado: si el estado es "Confirmado" o "Cancelado",
>   la opción de "Confirmar" no se muestra.

---

## CP-M05-009 – Caso positivo

| Campo | Contenido |
|---|---|
| **Identificador** | CP-M05-009 |
| **Título** | Confirmar un evento en estado "Pendiente" |
| **Objetivo** | Verificar que, al confirmar un evento en estado "Pendiente", el sistema cambie su estado a "Confirmado", muestre un mensaje de éxito y deje de ofrecer la opción "Confirmar". |
| **Requerimientos asociados** | M05-US5 (Escenario 1) · RF del TP1: *[completar]* |
| **Prerrequisitos** | - El administrador se encuentra en el "Panel del administrador".<br>- Los datos de prueba están cargados en el entorno de test. |
| **Datos de prueba** | Evento `{id: "E-01", cliente: "Juan Perez", teléfono: "2615555555", fecha: "20/11/2026", hora: "10:00", consulta: "Consulta inicial", estado: "Pendiente"}` |
| **Tipo de prueba** | Positiva |
| **Notas y preguntas** | - El envío del email al usuario invitado queda fuera del alcance de este CP (el componente expone el evento confirmado para dispararlo).<br>- ¿El texto del mensaje de éxito está definido por el cliente? Se utilizó "Evento confirmado correctamente". |

**Pasos**

| # | Acción del tester | Respuesta esperada del sistema |
|---|---|---|
| 1 | En el calendario del administrador, usar la flecha "›" (Mes siguiente) hasta llegar a noviembre 2026. | El calendario muestra "Noviembre 2026" y el día 20 marcado con un círculo gris (día con reservas). |
| 2 | Hacer clic en el día 20. | El día 20 queda marcado con un círculo verde. En "Reservas del día" se lista la tarjeta "Juan Perez – 10:00 hs" con la etiqueta "Pendiente" y el botón "Confirmar". |
| 3 | Hacer clic en el botón "Confirmar" de la tarjeta "Juan Perez". | Se muestra el mensaje "Evento confirmado correctamente". La etiqueta de la tarjeta cambia a "Confirmado" y el botón "Confirmar" deja de mostrarse. |

---

## CP-M05-010 – Caso negativo

| Campo | Contenido |
|---|---|
| **Identificador** | CP-M05-010 |
| **Título** | Un evento "Cancelado" no puede confirmarse |
| **Objetivo** | Verificar que un evento en estado "Cancelado" no ofrezca la opción "Confirmar" y que su estado no se modifique. |
| **Requerimientos asociados** | M05-US5 (Escenario 2) · RF del TP1: *[completar]* |
| **Prerrequisitos** | - El administrador se encuentra en el "Panel del administrador".<br>- Los datos de prueba están cargados en el entorno de test. |
| **Datos de prueba** | Evento `{id: "E-02", cliente: "María López", teléfono: "2614444444", fecha: "20/11/2026", hora: "11:00", consulta: "Seguimiento", estado: "Cancelado"}` |
| **Tipo de prueba** | Negativa |
| **Notas y preguntas** | - El mismo criterio aplica a eventos en estado "Confirmado" (cubierto en los tests automatizados).<br>- ¿Debería mostrarse el botón deshabilitado con un tooltip explicativo en lugar de ocultarlo? La US indica que "no se muestra". |

**Pasos**

| # | Acción del tester | Respuesta esperada del sistema |
|---|---|---|
| 1 | En el calendario del administrador, usar la flecha "›" (Mes siguiente) hasta llegar a noviembre 2026. | El calendario muestra "Noviembre 2026" y el día 20 marcado con un círculo gris (día con reservas). |
| 2 | Hacer clic en el día 20. | En "Reservas del día" se lista la tarjeta "María López – 11:00 hs" con la etiqueta "Cancelado". |
| 3 | Revisar las acciones disponibles en la tarjeta "María López". | La tarjeta no muestra el botón "Confirmar", no aparece ningún mensaje de éxito y la etiqueta sigue siendo "Cancelado". |

---

## Evidencia de la codificación

- Lógica de dominio: `src/domain/entities/evento.ts` → `puedeConfirmarse()` y `confirmar()`
  (lanza error si el evento no está "pendiente").
- Interfaz: `src/components/CalendarioAdmin.tsx` → etiqueta de estado y botón "Confirmar"
  solo para eventos pendientes; mensaje "Evento confirmado correctamente".
- Datos de prueba en la app: `src/app/page.tsx` (sección "Panel del administrador").
- Tests automatizados que reproducen los CPs:
  - `tests/components/confirmarEvento.test.tsx` (CP-M05-009, CP-M05-010 y variantes)
  - `tests/domain/confirmarEvento.test.ts` (reglas de dominio)
- Capturas: `docs/evidencia-m05-us5/01-antes-de-confirmar.png` y
  `docs/evidencia-m05-us5/02-despues-de-confirmar.png`.
