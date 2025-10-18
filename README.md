# DOTLINE

Un simple juego multijugador donde los jugadores se turnan para conectar puntos, crear líneas y sumar puntos.

## Reglas del Juego

1.  **Jugadores:** De 2 a 4 jugadores.
2.  **Inicio:** La partida comienza con un número de puntos (entre 3 y 10) distribuidos aleatoriamente en el tablero.
3.  **Objetivo:** Acumular más puntos que tus oponentes conectando puntos para formar líneas.
4.  **Turnos:** Por turnos, cada jugador debe dibujar una línea entre dos puntos.
5.  **Puntuación:** Cada línea completada suma 1 punto al jugador.
6.  **Límites de Conexión:**
    *   Un punto no puede tener más de 3 conexiones.
    *   Cuando un punto alcanza las 3 conexiones, se considera "muerto" y ya no puede ser usado.
7.  **Autoconexión (Loops):** Es posible conectar un punto consigo mismo para formar un "loop". Esto consume 2 de las 3 conexiones del punto.
8.  **No Intersecciones:** Las líneas no pueden cruzarse entre sí. Cualquier movimiento que intente cruzar una línea existente es inválido.
9.  **Fin de la Partida:** El juego termina cuando no se pueden realizar más movimientos válidos.
10. **Ganador:** El jugador con la mayor puntuación al final de la partida gana.

## Tecnologías Utilizadas

*   HTML5
*   CSS3
*   JavaScript (ES6+)