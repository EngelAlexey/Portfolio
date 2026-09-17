# social/

Motor que genera las piezas de Instagram de @alexherrera.dev: carruseles, posts, reels y un laboratorio de personajes. Llevan al blog, que es el resto de este repositorio. Nada de esta carpeta entra en el build.

## Antes de trabajar

1. **`docs/plan.md`.** El estado, lo programado y lo que toca después. Es local y no se versiona.
2. **`README.md` de esta carpeta.** Todas las reglas de formato, entero antes de hacer una pieza.
3. **`docs/temario.md`.** Los temas y los títulos aprobados.
4. **El `publicacion.md` de una pieza parecida.** Es el modelo del texto, la historia y la auditoría.

## Ciclo de un carrusel

```bash
cd social/<pieza>
node ../anchos.mjs 64 <valores…>   # ancho de la columna del glosario
node gen.mjs
node ../comprueba.mjs              # tiene que salir sin ✗
node ../exporta.mjs                # png/, vista-cuadricula.png, y PDF y zip en ~/Downloads
```

Después se mira cada PNG, y la portada también junto a la cuadrícula real del perfil.

## Reglas que Alex ha pedido

- **Idioma.** Todo en español, escrito primero en español. Voz impersonal, sin metáforas.
- **Carruseles explicativos.** Seis láminas: portada, una por familia y un resumen para guardar. De tres a cinco términos por lámina, cada uno con su nombre oficial y qué significa, en dos líneas como mucho.
- **Portadas.** Ningún color que ya tenga otra portada de la cuadrícula; se comprueba en instagram.com/alexherrera.dev, solo mirando. Todo el contenido va dentro del recorte 3:4 (`inset: COVER_INSET`).
- **Textos de publicación.** Con su estilo:
  - pregunta de gancho con emoji;
  - «En este carrusel te comparto…»;
  - 👉 y 🔗 con «(link en bio)»;
  - una pregunta para los comentarios;
  - 4 hashtags.

  El término que se busca va en la primera línea.
- **Verificación.** Cada afirmación se contrasta con su fuente primaria (RFC, documentación oficial) antes de publicar, y se entrega la tabla de afirmación, comprobación y veredicto.
- **Programación.** En Meta Business Suite, a las horas de «Active times». Nunca se acepta «Boost», que es un pago. No se crean recordatorios en el calendario.
- **Publicar, enviar o pagar** siempre se confirma antes, salvo que Alex ya lo haya pedido de forma explícita en la conversación.
- **Repositorio público.** Los kits de Freepik y Storyset y `docs/plan.md` no se versionan (ver `.gitignore`), y la documentación no nombra cuentas ni correos del trabajo.
