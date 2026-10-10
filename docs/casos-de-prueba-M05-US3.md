# Casos de prueba – M05-US03 "Reagendar evento"

Historia de usuario: como administrador, quiero reagendar los eventos previamente agendados por un usuario visitante.

## CP-M05-013 – Caso positivo

| Campo | Contenido |
|---|---|
| **Identificador** | CP-M05-013 |
| **Título** | Reagendar un evento con una franja horaria disponible |
| **Objetivo** | Verificar que el administrador pueda seleccionar una fecha y horario disponibles, confirmar el cambio y que el calendario refleje la nueva reserva. |
| **Requerimientos asociados** | AYA-M05-RF04 · M05-US03, escenarios 1 y 3 |
| **Prerrequisitos** | El administrador está en el panel de administración. Existe el evento `E-04` pendiente de Juan Perez el 20/11/2026 a las 10:00 y una franja disponible el 22/11/2026 a las 15:30. |
| **Datos de prueba** | Evento: `{id: "E-04", cliente: "Juan Perez", estado: "Pendiente", fecha: "20/11/2026", hora: "10:00"}`. Nueva franja: `22/11/2026 15:30`. |
| **Tipo de prueba** | Positiva |
| **Notas y preguntas** | La notificación se evidencia mediante el mensaje de éxito y el callback de notificación; el envío real de email queda fuera del alcance del prototipo. |

| # | Acción del tester | Respuesta esperada del sistema |
|---|---|---|
| 1 | Seleccionar el día 20/11/2026 y localizar el evento de Juan Perez. | Se muestra la tarjeta del evento pendiente, con la acción **Reagendar**. |
| 2 | Hacer clic en **Reagendar**. | Se abre el diálogo “Reagendar evento” con las fechas y horarios disponibles, incluida la franja 22/11/2026 15:30. |
| 3 | Seleccionar la franja 22/11/2026 15:30 y hacer clic en **Confirmar nuevo horario**. | Se muestra “Evento reagendado correctamente. Se notificó al usuario del cambio de horario.” El evento deja de aparecer el día 20 y se visualiza el 22/11/2026 a las 15:30. |

## CP-M05-014 – Caso negativo

| Campo | Contenido |
|---|---|
| **Identificador** | CP-M05-014 |
| **Título** | Impedir el reagendado de un evento en curso o completado |
| **Objetivo** | Verificar que no se permitan modificaciones de horario sobre eventos activos o finalizados. |
| **Requerimientos asociados** | AYA-M05-RF04 · M05-US03, escenario 2 |
| **Prerrequisitos** | El administrador está en el panel de administración. Existen los eventos `E-05` en curso y `E-06` completado el 20/11/2026. |
| **Datos de prueba** | `E-05`: cliente “María López”, estado “En curso”, hora 10:00. `E-06`: cliente “Pedro Gómez”, estado “Completado”, hora 11:00. |
| **Tipo de prueba** | Negativa |
| **Notas y preguntas** | La acción se mantiene visible pero deshabilitada, para comunicar claramente que el cambio de horario no está permitido en esos estados. |

| # | Acción del tester | Respuesta esperada del sistema |
|---|---|---|
| 1 | Seleccionar el día 20/11/2026. | Se muestran las tarjetas de María López y Pedro Gómez con sus estados respectivos. |
| 2 | Revisar las acciones disponibles en ambas tarjetas. | La acción **Reagendar** se muestra deshabilitada para ambos eventos. |
| 3 | Confirmar los datos de las tarjetas. | Las fechas y horarios originales se mantienen sin cambios; no se muestra notificación de modificación. |

## Evidencia de código

- Dominio: `src/domain/entities/evento.ts`, métodos `puedeReagendarse()` y `reagendar()`.
- Interfaz: `src/components/CalendarioAdmin.tsx`, diálogo de reagendado, selección de franja y actualización del calendario.
- Automatización: `tests/domain/reagendarEvento.test.ts` y `tests/components/reagendarEvento.test.tsx`.
