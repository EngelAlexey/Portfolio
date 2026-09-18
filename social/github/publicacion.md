# Aprende a usar GitHub

Carrusel explicativo, solo de Instagram, preparado el 16 de septiembre de 2026. Las seis láminas están en `png/`, numeradas en el orden de subida.

Van 20 conceptos y órdenes, y el resumen los repite todos:
- **Conceptos:** Git, GitHub, repositorio, rama y `.gitignore`.
- **En tu equipo:** `init`, `status`, `add`, `commit` y `log`.
- **Con GitHub:** `clone`, `origin`, `push`, `pull` y `fetch`.
- **Colaborar:** `switch`, `merge`, fork, pull request e issue.

Los valores van sin el prefijo `git`, que está en cada ejemplo. Cada orden se ejecutó con git 2.49.0 en repositorios de prueba antes de escribirla.

## Portada

- **Color: pizarra.** Es un tono nuevo de la paleta (`slate`), con el ámbar de acento. Ninguna portada publicada ni en cola es gris, y la del reel casi negro queda a tres filas.
- **Encuadre.** El título ocupa dos renglones, y todo el contenido va de 168 a 912 px, dentro del recorte de la cuadrícula.

## Texto de la publicación

```
¿Git y GitHub son lo mismo? Aprende a usar GitHub desde cero 🐙💻

Git registra cada cambio de tu proyecto en tu equipo. GitHub aloja ese repositorio en la nube para compartirlo, revisarlo y colaborar.

En este carrusel te comparto 20 conceptos y órdenes: los básicos, los que usas en tu equipo, los que hablan con GitHub y los de colaborar.

⚠️ Un detalle de seguridad: si subes una contraseña y la borras en el siguiente commit, sigue en el historial, y cualquiera que pueda clonar el repositorio puede verla. Lo primero es cambiarla, y el .env va en el .gitignore desde el principio.

👉 ¡Desliza y guarda la última lámina!
🔗 Cómo revisar con git lo que cambió un asistente de IA, en alexherrera.dev/es/blog/primeros-pasos-programar-con-ia (link en bio).

¿Qué orden de git te costó más entender? ¡Te leo en los comentarios! 👇💬

#GitHub #Git #Programacion #DesarrolloWeb
```

Sigue el estilo de las publicaciones anteriores de la cuenta: pregunta de gancho con emoji, «En este carrusel te comparto…», 👉 y 🔗 con «(link en bio)», una pregunta para los comentarios y cuatro hashtags. «Aprende a usar GitHub» va en la primera línea porque es la búsqueda del temario.

## Historia del mismo día

- **Qué se publica.** La publicación compartida en la historia, con el texto «¿Qué cambió la IA en tu proyecto? Git lo dice».
- **Adhesivo de enlace.** Con el texto «Leer el artículo» y esta dirección, que apunta a la sección 12:
  `https://www.alexherrera.dev/es/blog/primeros-pasos-programar-con-ia?utm_source=instagram&utm_medium=story&utm_campaign=github#12-c%C3%B3mo-se-revisa-lo-que-hizo`
- **Después.** Guardar la historia en la destacada del artículo.

El temario enlaza este carrusel con «Cómo deshacer cambios en Git», que está sin escribir. La sección 12 de «Primeros pasos para programar con IA» usa `git status`, `git add` y `git diff` para revisar lo que cambió un agente, que son órdenes de la lámina 3.

## Programación

Programado en Meta Business Suite el 17 de septiembre de 2026 para el lunes 12 de octubre, 7:00 p. m., la hora que Meta sugería para los lunes. Es la última de la segunda tanda. La historia se sube a mano ese mismo día.

## Auditoría

Las órdenes se ejecutaron el 16 de septiembre de 2026 con git 2.49.0, en repositorios de prueba con un remoto local.

| Afirmación | Comprobación | Veredicto |
|---|---|---|
| Git registra los cambios de tus archivos, en tu equipo | GitHub Docs, «About GitHub and Git»: «Git is a version control system that tracks changes to files». Pro Git §1.3: «Most operations in Git need only local files and resources» | Correcta |
| GitHub aloja repositorios de Git en la nube y añade herramientas para colaborar | GitHub Docs: «hosting your Git projects, called repositories, in the cloud, as well as adding planning and collaboration tools» | Correcta |
| Un repositorio es la carpeta del proyecto con todo su historial | git-init: crea un repositorio, «basically a `.git` directory». Ejecutado: el clon trae los commits anteriores | Correcta |
| GitHub crea la rama principal con el nombre `main` | GitHub Docs, «About branches»: «By default, GitHub names the default branch `main` in any new repository» | Correcta |
| `.gitignore` lista lo que Git no debe guardar, como `.env` | gitignore(5): archivos sin seguimiento que Git debe ignorar. Ejecutado: con `.env` en `.gitignore`, `git status` solo mostró `.gitignore` | Correcta |
| `git init` convierte la carpeta actual en un repositorio | git-init: «creates an empty Git repository». Ejecutado | Correcta |
| `git status` lista los archivos modificados, nuevos y preparados | git-status: diferencias entre índice y HEAD, entre árbol de trabajo e índice, y archivos sin seguimiento. Ejecutado (`??` y `A`) | Correcta |
| `git add .` suma los cambios de la carpeta al próximo commit | git-add: el índice prepara el contenido del siguiente commit, y un nombre de carpeta actualiza el índice con su estado completo | Correcta |
| `git commit -m` registra lo preparado con un mensaje | git-commit: «Create a new commit containing the current contents of the index and the given log message» | Correcta |
| `git log` muestra los commits del más reciente al más antiguo | git-log: «By default, the commits are shown in reverse chronological order». Ejecutado | Correcta |
| `git clone` copia el repositorio con todo su historial | git-clone: clona el repositorio y crea ramas de seguimiento. Ejecutado | Correcta |
| `origin` es el nombre que Git da por defecto al remoto al clonar | git-clone, `--origin`: «Instead of using the remote name `origin`…». Ejecutado: `git remote -v` mostró `origin` | Correcta |
| `git push` envía los commits que el remoto todavía no tiene | git-push: actualiza las referencias remotas y envía los datos que no estén ya en el remoto. Ejecutado contra un remoto local | Correcta |
| `git pull` descarga los commits nuevos y los une a tu rama | git-pull: ejecuta `git fetch` y después integra la rama remota en la actual. Ejecutado: creó un commit de fusión | Correcta |
| `git fetch` trae los cambios sin tocar tu rama | git-fetch: actualiza las ramas de seguimiento remoto. Ejecutado: la rama local siguió en su commit y `git status` pasó a «behind 1» | Correcta |
| `git switch -c nueva` crea una rama y se pasa a ella | git-switch, `-c`: «Create a new branch… before switching to the branch». Ejecutado | Correcta |
| `git merge nueva` integra sus commits en la rama actual | git-merge: «Incorporates changes from the named commits… into the current branch». Ejecutado | Correcta |
| Un fork es tu copia de un repositorio ajeno, para proponer cambios | GitHub Docs: los forks empiezan como copia del repositorio original, y permiten proponer cambios sin afectarlo | Correcta |
| Un pull request propone unir cambios para revisarlos y discutirlos antes | GitHub Docs: «proposals to merge code changes», para «discuss and review changes before merging them» | Correcta |
| Una issue registra un error, una idea o una tarea | GitHub Docs: «Issues can track bug reports, new features and ideas, and anything else you need to write down or discuss» | Correcta |
| Una contraseña borrada en el siguiente commit sigue en el historial y la ve quien clone | Ejecutado: tras `git rm .env` y un commit, `git show HEAD~1:.env` en un clon nuevo devolvió la clave. GitHub Docs, datos sensibles: se pueden quitar del historial reescribiéndolo | Correcta |
| Lo primero es cambiar la contraseña | GitHub Docs, datos sensibles: «as a first step you need to revoke and/or rotate that secret» | Correcta |

Fuentes:
- Documentación de Git: [git-init](https://git-scm.com/docs/git-init), [git-status](https://git-scm.com/docs/git-status), [git-add](https://git-scm.com/docs/git-add), [git-commit](https://git-scm.com/docs/git-commit), [git-log](https://git-scm.com/docs/git-log), [git-clone](https://git-scm.com/docs/git-clone), [git-push](https://git-scm.com/docs/git-push), [git-pull](https://git-scm.com/docs/git-pull), [git-fetch](https://git-scm.com/docs/git-fetch), [git-switch](https://git-scm.com/docs/git-switch), [git-merge](https://git-scm.com/docs/git-merge), [gitignore](https://git-scm.com/docs/gitignore) y [Pro Git §1.3](https://git-scm.com/book/en/v2/Getting-Started-What-is-Git%3F)
- GitHub Docs: [Git y GitHub](https://docs.github.com/en/get-started/start-your-journey/about-github-and-git), [ramas](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-branches), [forks](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo), [pull requests](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests), [issues](https://docs.github.com/en/issues/tracking-your-work-with-issues/learning-about-issues/about-issues) y [datos sensibles](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
