# Laboratorio de rutas y algoritmos de búsqueda

## 1. Paso a paso de construcción

Primero hice la estructura básica de la página con HTML y creé un tablero de **20x20 celdas**. Después añadí las herramientas para poder modificar el mapa: obstáculos, borrar, cambiar el inicio, añadir metas y poner pesos.

Cuando el tablero ya era editable, implementé los algoritmos **BFS y DFS**. Después añadí los costes de las celdas y las penalizaciones de las metas para poder implementar **Coste Uniforme (UCS)** y **A***.

El siguiente paso fue hacer la ejecución visual. Añadí la animación de las celdas exploradas, la ruta final y las métricas de cada algoritmo: nodos explorados, pasos, coste de ruta, coste de meta y coste total.

Después preparé cuatro escenarios diferentes para comprobar comportamientos concretos:

- **Menos pasos**
- **Pesos**
- **Meta con coste**
- **Sin solución**

Una de las partes que más tuve que corregir fue la **tabla comparativa**. Al principio se actualizaba de una forma que no era la que quería. Finalmente la dejé para que empiece con valores a cero y solo calcule los resultados cuando se pulsa **Comparar todos**. Si se modifica el tablero, la tabla vuelve a cero porque los resultados anteriores ya no corresponden al mapa actual.

También fui mejorando la interfaz para que fuera más clara, separando los controles, el tablero, las métricas y la comparación.

---

## 2. Arquitectura del proyecto

El proyecto está dividido en cuatro archivos principales:

- **index.html**: contiene la estructura de la página.
- **styles.css**: contiene el diseño de la interfaz.
- **script.js**: contiene toda la lógica y los algoritmos.
- **README.md**: contiene la explicación del proyecto.

### Estructura de datos del mapa

El tablero se guarda en una matriz de 20x20 llamada `board`.

Cada celda guarda principalmente:

- si es un obstáculo;
- el coste de entrar en ella;
- la referencia al elemento visual de esa celda.

El inicio se guarda en una variable `start` con su fila y columna.

Las metas se guardan en un array `goals`. Cada meta contiene:

- fila;
- columna;
- penalización;
- identificador.

Esto permite tener varias metas en el mismo mapa.

### Flujo desde el clic hasta el resultado

El funcionamiento general es:

1. El usuario selecciona una herramienta.
2. Hace clic sobre una celda.
3. JavaScript modifica el estado del tablero.
4. Al pulsar **Ejecutar**, se ejecuta el algoritmo seleccionado.
5. El algoritmo devuelve los nodos explorados, la ruta y la meta encontrada.
6. Se reconstruye la ruta.
7. Se muestra la animación.
8. Se actualizan las métricas.

Cuando se pulsa **Comparar todos**, se ejecutan los cuatro algoritmos sobre el mismo estado del tablero y los resultados se muestran en la tabla.

---

## 3. Explicación de los algoritmos

### BFS

BFS utiliza una **cola** y explora el tablero por niveles. Va guardando las posiciones visitadas para no repetirlas y los padres de cada nodo para reconstruir la ruta. Encuentra una ruta con el menor número de pasos cuando todos los movimientos tienen el mismo coste.

### DFS

DFS utiliza una **pila** y sigue una rama todo lo posible antes de retroceder. También guarda visitados y padres. Puede encontrar una ruta, pero no garantiza que sea la más corta ni la de menor coste.

### Coste Uniforme (UCS)

UCS selecciona siempre el nodo con **menor coste acumulado**. Tiene en cuenta los pesos de las celdas y el coste de la meta. Guarda costes, visitados y padres para poder reconstruir la ruta.

### A*

A* utiliza el coste acumulado más una heurística: **f(n) = g(n) + h(n)**. En este proyecto uso la **distancia Manhattan** como `h(n)`, ya que solo se puede mover arriba, abajo, izquierda y derecha. También guarda visitados, costes y padres.

## 4. Comparación de los cuatro laberintos

Para comparar los algoritmos he utilizado los cuatro escenarios preparados en la aplicación.

### Escenario 1: Menos pasos

En este mapa no hay pesos importantes, así que lo principal es la cantidad de pasos.

- **BFS:** encuentra una ruta de 7 pasos.
- **DFS:** encuentra una ruta mucho más larga, de 34 pasos.
- **UCS:** también encuentra la ruta de 7 pasos porque todas las celdas tienen prácticamente el mismo coste.
- **A\*:** encuentra la misma ruta de 7 pasos, pero explorando menos nodos.

**Conclusión:** este escenario muestra que BFS funciona bien cuando buscamos pocos pasos y que A* puede llegar al mismo resultado explorando menos.

### Escenario 2: Pesos

En este mapa existe un camino corto, pero algunas de sus celdas tienen un coste muy alto.

- **BFS:** encuentra una ruta corta de 17 pasos, pero su coste total es 113.
- **DFS:** encuentra otra ruta de 39 pasos y coste 39.
- **UCS:** encuentra una ruta de 19 pasos y coste 19.
- **A\*:** también consigue coste 19.

**Conclusión:** aquí se ve que tener menos pasos no significa tener menor coste. UCS y A* tienen en cuenta los pesos y por eso encuentran una solución más barata que BFS.

### Escenario 3: Meta con coste

En este caso hay varias metas. Una está más cerca, pero tiene una penalización.

- **BFS:** llega a la meta cercana en 6 pasos, pero el coste total es 26.
- **DFS:** encuentra otra solución con coste 39.
- **UCS:** elige la meta con menor coste total, que cuesta 19.
- **A\*:** también elige una solución con coste total 19.

**Conclusión:** BFS se fija principalmente en los pasos, mientras que UCS y A* tienen en cuenta el coste completo y pueden elegir una meta más lejana si sale más barata.

### Escenario 4: Sin solución

En este mapa una barrera de obstáculos impide llegar a la meta.

- **BFS:** no encuentra ruta.
- **DFS:** no encuentra ruta.
- **UCS:** no encuentra ruta.
- **A\*:** no encuentra ruta.

Los cuatro terminan la búsqueda después de explorar las posiciones accesibles.

**Conclusión:** este escenario sirve para comprobar que los algoritmos también terminan correctamente cuando no existe ninguna solución.

### Comparación general

En resumen:

- **BFS** es útil cuando queremos una ruta con pocos pasos.
- **DFS** puede encontrar una solución, pero no garantiza que sea la mejor.
- **UCS** es más adecuado cuando existen diferentes costes.
- **A\*** también tiene en cuenta el coste y utiliza la heurística para intentar llegar a la solución explorando menos nodos.

## 5. Lenguaje de etiquetado y lenguaje de programación

### HTML

HTML es un **lenguaje de marcado**. Lo utilizo para organizar los elementos de la aplicación.

Las partes principales del HTML son:

- panel de selección del algoritmo;
- controles de ejecución;
- herramientas de dibujo;
- tablero;
- panel de métricas;
- tabla comparativa.

HTML define qué elementos existen, pero no contiene la lógica de los algoritmos.

### CSS

CSS se utiliza para definir el aspecto visual.

Lo utilizo para:

- colores;
- tamaños;
- posición de los paneles;
- diseño de botones;
- diseño de las celdas;
- colores de exploración y ruta;
- tabla comparativa.

### JavaScript

JavaScript sí es un **lenguaje de programación**.

En `script.js` se encuentra:

- la creación del tablero;
- la edición de las celdas;
- los cuatro algoritmos;
- los escenarios;
- la reconstrucción de las rutas;
- la animación;
- las métricas;
- la comparación de resultados.

Por tanto, HTML organiza, CSS da estilo y JavaScript contiene el comportamiento y la lógica.

---

## 6. Mejoras implementadas

No he implementado ninguna mejora adicional aparte de los requisitos principales del ejercicio.

## Separación de JavaScript

Para evitar que la generación de escenarios afecte a la tabla comparativa, el proyecto usa ahora dos archivos JavaScript:

- `script.js`: algoritmos, tablero, métricas y tabla comparativa.
- `scenarios.js`: generación de los cuatro escenarios.

Los dos archivos trabajan sobre el mismo `board`, `start` y `goals`, por lo que al pulsar **Comparar todos** se calculan los cuatro algoritmos sobre el escenario que se acaba de generar.
