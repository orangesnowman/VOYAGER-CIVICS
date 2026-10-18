# Plan de Implementación: Contadores de Notificación Individuales en Mensajería Voyager

Este plan establece la refinación de la interfaz de **Mensajería Voyager** para sustituir el contador general de no leídos por insignias numéricas individuales en cada una de las tres pestañas, cumpliendo estrictamente con la guía visual y funcional aprobada.

---

## 1. Identificación de la Lógica Existente

- **Estructura de Datos**:
  Cada mensaje en `src/components/VoyagerMessagingModal.tsx` contiene:
  ```ts
  interface ChannelMessage {
    id: string;
    sender: string;
    date: string;
    preview: string;
    body: string;
    isUnread: boolean;
    channel: 'profe' | 'grupo' | 'anuncios';
  }
  ```
- **Lógica Anterior**:
  - Existía un contador general acumulado (`totalUnreadCount`) ubicado al lado del encabezado `MENSAJERÍA VOYAGER` que mostraba `"5 sin leer"`.
  - Cada pestaña solo mostraba un punto rojo estático sin número cuando `hasUnread` era verdadero.
  - El botón de sobre en el perfil del Pasaporte (`src/components/RoadmapPanel.tsx`) refleja el total de no leídos mediante `onUnreadCountChange(count)` para mostrar su punto indicador y navegar por desplazamiento suave (`scrollIntoView`).

---

## 2. Arquitectura de los Nuevos Contadores Individuales

```
┌────────────────────────────────────────────────────────────────────────┐
│ PASAPORTE / ROADMAP                                                    │
│                                                                        │
│ [ Foto Perfil ]                                                        │
│ [ ✉ Sobre (punto rojo si total > 0) ] ──(scroll)──┐                   │
│                                                   │                    │
│ ... Calendario de Actividades ...                 ▼                    │
├────────────────────────────────────────────────────────────────────────┤
│ MENSAJERÍA VOYAGER  (Sin contador general)                             │
├────────────────────────────────────────────────────────────────────────┤
│ ┌───────────────────┐ ┌───────────────────┐ ┌────────────────────────┐ │
│ │  La Profe   🔴 1  │ │ Grupo Chat  🔴 2  │ │   Anuncios   🔴 2      │ │
│ └───────────────────┘ └───────────────────┘ └────────────────────────┘ │
│                                                                        │
│ Lista de mensajes:                                                     │
│ - Al hacer clic en un mensaje no leído:                                │
│   isUnread = false ──> Decrementa contador de pestaña inmediatamente    │
│ - Al llegar a 0: Desaparece el círculo rojo de esa pestaña             │
└────────────────────────────────────────────────────────────────────────┘
```

### Especificaciones Visuales del Círculo Notificador:
- **Color de Fondo**: Rojo puro (`#FF0000`).
- **Color del Número**: Blanco puro (`#FFFFFF`).
- **Peso Tipográfico**: Demi-bold (`font-weight: 600` / `font-semibold`).
- **Alineación**: Centrado geométrico horizontal y vertical perfecto (`flex items-center justify-center`).
- **Forma y Estilo**: Círculo compacto (`min-w-[16px] h-4 px-1 rounded-full`), sin bordes, sin sombras, sin gradientes y sin elementos decorativos adicionales.
- **Posición**: Anclado en la esquina superior derecha del icono de la pestaña (`-top-1.5 -right-3`), visible con total claridad sin solapar el icono ni el texto de la pestaña.

---

## 3. Comportamiento Dinámico y Casos de Uso

1. **Valores Iniciales**:
   - **La Profe**: 1 mensaje sin leer (`lp-1`).
   - **Grupo Chat**: 2 mensajes sin leer (`gc-1`, `gc-2`).
   - **Anuncios**: 2 mensajes sin leer (`an-1`, `an-2`).
2. **Apertura de Pestañas**:
   - Hacer clic en una pestaña solo conmuta la vista activa y la reordena al extremo izquierdo. **No marca** mensajes como leídos.
3. **Lectura Individual**:
   - Hacer clic sobre un mensaje no leído individualmente cambia su estado a `isUnread: false`, reduciendo de inmediato el contador de esa sección en 1.
4. **Desaparición en Cero**:
   - Cuando el contador de una pestaña llega a 0, la insignia roja desaparece por completo.
5. **Recepción de Nuevos Mensajes**:
   - Nuevos mensajes recibidos (por ejemplo, respuesta pedagógica automática) ingresan con `isUnread: true`, incrementando de inmediato el contador correspondiente.
6. **Preservación del Sobre**:
   - El botón de sobre bajo la foto de perfil en Pasaporte conserva su desplazamiento suave al `#voyager-messaging-section` y su propio indicador sincronizado con el total de mensajes no leídos.

---

## 4. Archivos Modificados

1. **`src/components/VoyagerMessagingModal.tsx`**:
   - Eliminación del badge general junto al encabezado de sección.
   - Sustitución del punto estático por la insignia numérica individual con fondo `#FF0000` y tipografía blanca demi-bold.
   - Sincronización del estado de lectura individual y persistencia local limpia.
2. **`src/components/RoadmapPanel.tsx`**:
   - Verificación de la preservación total del icono de sobre y su desplazamiento fluido.

---

## 5. Criterios de Aprobación y Validación
- Cero errores de compilación (`compile_applet`).
- Cero advertencias de linter (`lint_applet`).
- Verificación de legibilidad y proporciones visuales en resoluciones móviles y de escritorio.
