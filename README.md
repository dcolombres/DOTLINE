# DOTLINE

Un simple juego multijugador donde los jugadores se turnan para conectar puntos, crear líneas y sumar puntos.

## Reglas del Juego

1.  **Jugadores:** De 2 a 4 jugadores, o 1 jugador contra la IA (MIA).
2.  **Inicio:** La partida comienza con 3, 4 o 5 puntos distribuidos aleatoriamente.
3.  **Objetivo:** Acumular más puntos que tus oponentes conectando puntos para formar líneas.
4.  **Turnos:** Por turnos, cada jugador debe dibujar una línea entre dos puntos distintos.
5.  **Puntuación:** Cada línea completada suma 1 punto al jugador.
6.  **Límites de Conexión:**
    *   Un punto no puede tener más de 3 conexiones.
    *   Cuando un punto alcanza las 3 conexiones, se considera "muerto" (gris) y ya no puede ser usado.
7.  **No Autoconexión:** No es posible iniciar y terminar una línea en el mismo punto.
8.  **No Intersecciones:** Las líneas no pueden cruzarse entre sí.
9.  **Fin de la Partida:** El juego termina cuando no quedan movimientos válidos posibles.
10. **Ganador:** El jugador con la mayor puntuación al final de la partida gana.

## Tecnologías Utilizadas

*   HTML5
*   CSS3
*   JavaScript (ES6+)