# ¿Un JSON puede hacerte administrador?

Reel de 18,6 s, preparado el 17 de septiembre de 2026. Tema 71 del temario, patrón A: un riesgo escondido en algo que se hace a diario. Segundo de la serie con personaje; el primero es `reel-secreto-en-git/`.

Mismo escenario y mismo rig: escribe, llega un JSON con una clave `__proto__`, los tres objetos de la aplicación se encienden con la insignia de administrador, lo arregla y termina tranquilo. La acción es la 43 del laboratorio (`personajes/acciones/guion-prototipo.mjs`), y el escritorio sale de `personajes/escenario.mjs`, que ahora comparten los dos guiones.

No hay artículo detrás: «Aprende a escribir JavaScript seguro» está sin escribir, así que el cierre lleva al índice del blog.

## Portada

- **Es el cuadro del segundo 2,4**, con el personaje tecleando y el titular encima, sobre el tinte claro de la ciruela.
- **Ojo con la cuadrícula.** La portada del reel del `.env` es el tinte claro del azul petróleo: las dos son pálidas y no deberían quedar una al lado de la otra. Al programarlos hay que mirar `docs/vista-perfil-serie.png` y meter un carrusel de color entre ellos.

## Texto de la publicación

```
¿Un JSON puede hacerte administrador? 🧩🔐

Sí, si lo fusionas a ciegas. Un objeto con la clave __proto__ escribe en el prototipo de Object, y desde ese momento TODOS los objetos de tu aplicación llevan esa propiedad.

En este reel te comparto qué pasa y los dos pasos para evitarlo:

1️⃣ No fusiones recursivamente lo que llega de fuera.
2️⃣ Copia con structuredClone: no arrastra el prototipo.

⚠️ Comprobado en Node 24.19.0: la fusión ingenua deja ({}).esAdmin en true, y structuredClone no.

💡 Si lo que necesitas es un diccionario, créalo con Object.create(null): no tiene prototipo que contaminar.

👉 ¡Guárdalo para tu próxima API!
🔗 Más sobre programación y seguridad en alexherrera.dev/es/blog (link en bio).

¿Sabías de esta? ¡Te leo en los comentarios! 👇💬

Ilustración: Designed by Freepik

#JavaScript #NodeJS #Ciberseguridad #Programacion
```

El término que se busca va en la primera línea. La atribución a Freepik es obligatoria: el kit del personaje es de la cuenta gratuita.

## Historia del mismo día

- **Qué se publica.** El reel compartido en la historia, con el texto «¿Fusionas el JSON que te llega?».
- **Adhesivo de enlace.** Con el texto «Más en el blog» y esta dirección:
  `https://www.alexherrera.dev/es/blog?utm_source=instagram&utm_medium=story&utm_campaign=prototipo`

## Programación

Sin programar. Falta que Alex dé por bueno el reel y elija fecha.

## Auditoría

Todo se ejecutó el 17 de septiembre de 2026 en esta máquina, con Node 24.19.0.

| Afirmación | Comprobación | Veredicto |
|---|---|---|
| Una fusión recursiva ingenua de `{"__proto__":{"esAdmin":true}}` contamina el prototipo | Tras fusionar en un objeto vacío, `({}).esAdmin` devuelve `true` | Correcta |
| A partir de ahí la propiedad la ven todos los objetos de la aplicación | Es la definición de la cadena de prototipos: el objeto de prueba no la tiene como propia y la hereda de `Object.prototype` | Correcta |
| `structuredClone` no arrastra el prototipo | `structuredClone(JSON.parse('{"__proto__":{"x":1}}'))` deja `({}).x` en `undefined` | Correcta |
| Un diccionario creado con `Object.create(null)` no se contamina | La misma fusión sobre él guarda `__proto__` como clave propia y `({}).esAdmin` sigue en `undefined` | Correcta |
| La clave se llama `__proto__` | `JSON.parse` la conserva como clave del objeto; es la asignación posterior la que escribe en el prototipo | Correcta |

Fuente de la demostración: ejecutada aquí. El temario la traía ya anotada como «comprobado en Node 24.19.0».

## Lo que estrena este reel

- **`personajes/escenario.mjs`**: la mesa, el portátil, la taza, la libreta, la planta, el ratón, el suelo y la luz de la pantalla salen de la acción 42 a un módulo común. Cada guion añade solo sus objetos.
- Es el primero que **reutiliza la serie entera**: la misma actuación, el mismo encuadre y los mismos cinco tiempos, con otro tema encima.
