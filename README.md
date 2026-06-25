# Retro Neon Snake

Una versión moderna con estética retro y minimalista del clásico juego "Snake". La interfaz cuenta con un diseño de estilo arcade cyberpunk, sonido sintetizado en tiempo real y persistencia para guardar tu récord personal.

## Características

- **Diseño Retro de Neón**: Interfaz oscura con colores neón llamativos, sombras con resplandor y un efecto sutil de líneas de escaneo CRT en pantalla.
- **Sonidos Procedurales**: Efectos de sonido integrados creados a partir de código mediante la API de Audio Web (Web Audio API). No requiere la descarga de archivos de audio adicionales.
- **Control del Sonido**: Botón interactivo para silenciar y activar el sonido en tiempo real.
- **Persistencia de Puntuación**: Guarda de forma automática el récord más alto en el almacenamiento local de tu navegador (`localStorage`).
- **Restablecimiento del Récord**: Botón con confirmación para borrar el puntaje máximo registrado y empezar a competir desde cero.
- **Diseño Responsivo**: Adaptado para visualizarse correctamente en pantallas de diferentes tamaños.

## Tecnologías Utilizadas

- **HTML5** (Estructura y Lienzo `<canvas>`)
- **CSS3** (Estilos a medida, efectos de brillo y animaciones de fotogramas clave)
- **JavaScript** (Lógica del motor de juego y API de Audio Web)

## Controles de Juego

- **Moverse**: Usa las teclas de flecha (<kbd>▲</kbd>, <kbd>▼</kbd>, <kbd>◄</kbd>, <kbd>►</kbd>) o las teclas <kbd>W</kbd>, <kbd>A</kbd>, <kbd>S</kbd>, <kbd>D</kbd>.
- **Iniciar/Pausar/Reanudar**: Presiona la tecla <kbd>Espacio</kbd> o haz clic en el botón principal de la pantalla.
- **Reiniciar al perder**: Presiona la tecla <kbd>Espacio</kbd> o haz clic en el botón del menú de fin de juego.
- **Silenciar**: Haz clic en el botón de bocina (🔊 / 🔇) en el pie de página.
- **Borrar Récord**: Haz clic en el botón de papelera (🗑️) en el pie de página para reiniciar el puntaje máximo registrado a 000.

## Cómo Ejecutar el Proyecto

1. Descarga o clona los archivos del proyecto en una carpeta local.
2. Abre el archivo `index.html` en cualquier navegador web moderno (Chrome, Firefox, Safari, Edge, etc.).
3. ¡Comienza a jugar presionado el botón Jugar o la Barra Espaciadora!
