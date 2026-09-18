# Un secreto en el historial de Git

Reel de 27,4 s, preparado el 17 de septiembre de 2026. Sale del tema 7 del temario, patrón A: un riesgo escondido en algo que se hace a diario. No tiene artículo detrás —«¿Qué son las variables de entorno?» está sin escribir—, así que el cierre lleva al blog y no a un artículo concreto.

Cinco láminas encadenadas: la orden que parece borrar, la prueba de que no borró, lo que se lleva cada copia, la corrección y el cierre.

## Portada

- **Color: naranja profundo.** Es el cuadro del segundo 2,4, que cae en la primera lámina. En la cuadrícula esta pieza quedaría la decimocuarta, con la pizarra de `github/` al lado, la ciruela de `api/` arriba y la oliva de `terminal-linux/` debajo: el naranja es el que más lejos queda de las tres. El único naranja anterior es el de `reel-revisar-codigo/`, nueve publicaciones atrás.
- **Encuadre.** Todo dentro de la zona segura del reel: 300 px arriba, 420 abajo y 120 a los lados.

## Texto de la publicación

```
¿Cómo se borra una contraseña del historial de Git? 🔐🌿

git rm --cached .env deja de rastrear el archivo, pero el valor sigue escrito en el commit anterior: cualquiera que clone el repositorio se lo lleva con él.

En este reel te comparto qué pasa de verdad cuando «borras» un secreto de Git y los dos pasos que sí lo resuelven.

⚠️ Primero se cambia la credencial. Reescribir el historial no sirve si la clave sigue siendo válida: GitGuardian midió que el 64 % de las filtradas en 2022 lo seguía en enero de 2026.

💡 Mira el tuyo con git log -p -- .env

👉 ¡Guárdalo para cuando te pase!
🔗 Más sobre programación y seguridad en alexherrera.dev/es/blog (link en bio).

¿Te ha pasado subir un .env sin querer? ¡Te leo en los comentarios! 👇💬

#Git #Ciberseguridad #Programacion #DevOps
```

Sigue el estilo de las publicaciones anteriores de la cuenta: pregunta de gancho con emoji, «En este reel te comparto…», 👉 y 🔗 con «(link en bio)», una pregunta para los comentarios y cuatro hashtags. El término que se busca —cómo borrar una contraseña del historial de Git— va en la primera línea.

## Historia del mismo día

- **Qué se publica.** El reel compartido en la historia, con el texto «¿Cuántos `.env` hay en tu historial?».
- **Adhesivo de enlace.** Con el texto «Más en el blog» y esta dirección:
  `https://www.alexherrera.dev/es/blog?utm_source=instagram&utm_medium=story&utm_campaign=secreto-en-git`

El artículo del tema no existe todavía, así que la historia lleva al índice del blog.

## Programación

Sin programar. La propuesta es el **viernes 16 de octubre de 2026 a la 1:00 p. m.**, que es la hora que Meta sugería para los viernes y el último día que admitía la ventana de Business Suite vista el 17 de septiembre. Va detrás de `github/` (lunes 12), con lo que la serie de carruseles queda cerrada y el reel abre la siguiente tanda. Falta que Alex lo confirme.

## Auditoría

Las cinco órdenes se ejecutaron el 17 de septiembre de 2026 en un repositorio de prueba creado para esto, con Git 2.49.0.windows.1 y `git-filter-repo` instalado. La contraseña del ejemplo (`pr0d-2024`) es inventada.

| Afirmación | Comprobación | Veredicto |
|---|---|---|
| `git rm --cached .env` y un commit sacan el archivo del proyecto | En el repositorio de prueba, `git ls-files` deja de listarlo y `git status` queda limpio | Correcta |
| El valor sigue escrito en un commit anterior | `git log -p --all -- .env` imprime `+DB_PASSWORD=pr0d-2024` en el commit que lo añadió y `-DB_PASSWORD=pr0d-2024` en el que lo quitó | Correcta |
| Se lee con una orden, sin permisos especiales | `git show HEAD~1:.env` imprime la línea entera | Correcta |
| Cada copia se lleva el historial entero | Tras `git clone`, en el clon `git show HEAD~1:.env` imprime lo mismo | Correcta |
| Y las copias ajenas no se pueden limpiar | GitHub, «Removing sensitive data from a repository»: «You cannot remove sensitive data from other users' clones of your repository», y los commits siguen accesibles «in any clones or forks of your repository» y «directly via their SHA-1 hashes in cached views on GitHub» | Correcta |
| Primero se cambia la credencial | La misma página: «if the sensitive data you need to remove is a secret (e.g. password/token/credential), as is often the case, then as a first step you need to revoke and/or rotate that secret» | Correcta |
| El 64 % de las credenciales válidas en 2022 seguía activo en enero de 2026 | GitGuardian, *State of Secrets Sprawl 2026* (17 de marzo de 2026): «when we retested that same dataset in January 2026, the validity rate was still above 64%» | Correcta, y conservadora: el informe dice «por encima del 64 %» |
| En 2025 se añadieron 28,65 millones de secretos a repositorios públicos de GitHub | El mismo informe: «28.65 million new hardcoded secrets were added to public GitHub commits in 2025 alone, a 34% increase year over year» | Correcta |
| `git filter-repo --invert-paths --path .env` lo borra del historial | Ejecutado sobre una copia del repositorio de prueba: después, `git log -p --all -- .env` no devuelve nada y buscar el valor en todos los commits (`git rev-list --all` con `git grep`) tampoco | Correcta |

Fuentes:

- [GitGuardian, *The State of Secrets Sprawl 2026*](https://blog.gitguardian.com/the-state-of-secrets-sprawl-2026/)
- [GitHub Docs, *Removing sensitive data from a repository*](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)

## Lo que estrena este reel

Es el primero renderizado con los ejercicios del laboratorio ya en el motor: la banda de acento y el borde suave de la cortinilla, el texto que se aparta y el que entra detrás del fondo, el panel que se despliega desde su barra y los renglones de la terminal que entran por abajo. Detalle en el README, «Reels».
