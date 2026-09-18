# ¿Qué hacer si subiste el .env?

Reel de 20,7 s, preparado el 17 de septiembre de 2026. Sale del tema 7 del temario, patrón A: un riesgo escondido en algo que se hace a diario. No tiene artículo detrás —«¿Qué son las variables de entorno?» está sin escribir—, así que el cierre lleva al blog y no a un artículo concreto.

Es una historia con personaje, no una explicación. Alguien escribe en su portátil, una burbuja con un candado sube a la nube, se asusta, cambia la credencial, reescribe el historial y termina tranquilo. Las dos versiones anteriores —una con terminales, otra con un diagrama de la cadena de commits— las rechazó Alex por técnicas y por ininteligibles.

El personaje sale del laboratorio (`personajes/acciones/guion.mjs`, acción 42) y lo mueve el mismo rig, cuadro a cuadro, a través de `personaje-reel.mjs`.

## Portada

- **Es el cuadro del segundo 2,4**, con el personaje tecleando y el titular encima. El fondo es el tinte claro del azul petróleo, que no se parece a ninguna de las trece portadas anteriores: todas son de color saturado. En la cuadrícula queda la decimocuarta.
- **Encuadre.** Todo dentro de la zona segura del reel: 300 px arriba, 420 abajo y 120 a los lados.

## Texto de la publicación

```
¿Qué hacer si subiste el .env a GitHub? 🔐😱

Borrarlo del proyecto no lo borra del historial: el valor sigue escrito en el commit anterior, y quien clone el repositorio se lo lleva con él.

En este reel te comparto los dos pasos, en este orden:

1️⃣ Cambia la credencial. Es lo primero: mientras siga siendo válida, da igual lo que hagas con el historial.
2️⃣ Reescribe el historial: git filter-repo --invert-paths --path .env

⚠️ Y avisa a quien tenga una copia. Los clones y los forks ajenos no los puedes limpiar tú.

💡 GitGuardian midió que el 64 % de las credenciales válidas filtradas en 2022 seguía activo en enero de 2026.

👉 ¡Guárdalo para cuando te pase!
🔗 Más sobre programación y seguridad en alexherrera.dev/es/blog (link en bio).

¿Te ha pasado subir un .env sin querer? ¡Te leo en los comentarios! 👇💬

Ilustración: Designed by Freepik

#Git #Ciberseguridad #Programacion #DevOps
```

Sigue el estilo de las publicaciones anteriores: pregunta de gancho con emoji, «En este reel te comparto…», 👉 y 🔗 con «(link en bio)», una pregunta para los comentarios y cuatro hashtags. El término que se busca va en la primera línea.

**La atribución es obligatoria.** El kit del personaje es de Freepik con cuenta gratuita, confirmado por Alex el 17 de septiembre de 2026, así que «Designed by Freepik» va en el texto de toda publicación que use este personaje. Es la misma regla que ya se aplica a las láminas de Storyset.

## Historia del mismo día

- **Qué se publica.** El reel compartido en la historia, con el texto «¿Cuántos `.env` hay en tu historial?».
- **Adhesivo de enlace.** Con el texto «Más en el blog» y esta dirección:
  `https://www.alexherrera.dev/es/blog?utm_source=instagram&utm_medium=story&utm_campaign=secreto-en-git`

El artículo del tema no existe todavía, así que la historia lleva al índice del blog.

## Programación

Sin programar. Falta que Alex dé por bueno el reel y elija fecha.

## Auditoría

Las órdenes se ejecutaron el 17 de septiembre de 2026 en un repositorio de prueba creado para esto, con Git 2.49.0.windows.1 y `git-filter-repo` instalado. La contraseña del ejemplo era inventada.

| Afirmación | Comprobación | Veredicto |
|---|---|---|
| Borrar el archivo del proyecto no lo borra del historial | Tras `git rm --cached .env` y un commit, `git log -p --all -- .env` sigue imprimiendo el valor | Correcta |
| Quien clone el repositorio se lo lleva | En el clon, `git show HEAD~1:.env` imprime la línea entera | Correcta |
| Los clones y los forks ajenos no se pueden limpiar | GitHub, «Removing sensitive data from a repository»: «You cannot remove sensitive data from other users' clones of your repository» | Correcta |
| Lo primero es cambiar la credencial | La misma página: «if the sensitive data you need to remove is a secret… then as a first step you need to revoke and/or rotate that secret» | Correcta |
| El 64 % de las credenciales válidas en 2022 seguía activo en enero de 2026 | GitGuardian, *State of Secrets Sprawl 2026* (17 de marzo de 2026): «when we retested that same dataset in January 2026, the validity rate was still above 64%» | Correcta, y conservadora: el informe dice «por encima del 64 %» |
| `git filter-repo --invert-paths --path .env` lo borra del historial | Ejecutado sobre una copia del repositorio de prueba: después, `git log -p --all -- .env` no devuelve nada, y buscar el valor en todos los commits tampoco | Correcta |

Fuentes:

- [GitGuardian, *The State of Secrets Sprawl 2026*](https://blog.gitguardian.com/the-state-of-secrets-sprawl-2026/)
- [GitHub Docs, *Removing sensitive data from a repository*](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)

## Lo que estrena este reel

- **El personaje, dentro del motor de reels.** `personaje-reel.mjs` lleva a la página del reel el mismo tiempo de ejecución del laboratorio —curvas, rig, ayudas y definiciones— y `seek` mueve la figura con el tiempo de su lámina. La pose sigue siendo función pura del tiempo, así que el vídeo sale igual en cualquier máquina.
- **Una lámina con fondo propio**, el de la acción del laboratorio: la paleta del personaje se calcula por contraste contra él.
- **Texto que se releva.** Cada frase entra, se lee y deja sitio a la siguiente. Un bloque fuera de su tramo deja de ocupar sitio, o empujaría al que se ve hacia el centro del cuadro.
- **Sonido pendiente.** El `sfx.wav` sale casi mudo: la escena del personaje no marca golpes de tecla. Hay que marcarlos en la acción o sonorizar el reel aparte.
