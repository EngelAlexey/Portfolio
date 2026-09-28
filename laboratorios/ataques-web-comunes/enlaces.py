B = 'src/content/articles/'
edits = {
    B + 'como-proteger-una-pagina-web/es.mdx': [
        ("Para las peticiones entre orígenes, lea [Qué es CORS](/es/blog/que-es-cors), y para las dependencias, [la diferencia entre npm y pnpm](/es/blog/npm-vs-pnpm-seguridad).",
         "Para las peticiones entre orígenes, lea [Qué es CORS](/es/blog/que-es-cors), y para las dependencias, [la diferencia entre npm y pnpm](/es/blog/npm-vs-pnpm-seguridad). [Los ataques web más comunes](/es/blog/ataques-web-comunes) muestra catorce ataques contra estas capas, cada uno con la petición que lo aprovecha y su corrección."),
        ("Afecta a cualquier función que descarga una URL, como una vista previa de enlaces o una importación.",
         "Afecta a cualquier función que descarga una URL, como una vista previa de enlaces o una importación. El punto 5 de [los ataques web más comunes](/es/blog/ataques-web-comunes) lo reproduce y lo corrige."),
    ],
    B + 'como-proteger-una-pagina-web/en.mdx': [
        ("For requests across origins, read [What CORS is](/en/blog/what-is-cors), and for dependencies, [npm vs pnpm](/en/blog/npm-vs-pnpm-install-security).",
         "For requests across origins, read [What CORS is](/en/blog/what-is-cors), and for dependencies, [npm vs pnpm](/en/blog/npm-vs-pnpm-install-security). [The most common web attacks](/en/blog/common-web-attacks) shows fourteen attacks against these layers, each with the request that exploits it and its fix."),
        ("It affects any feature that downloads a URL, such as a link preview or an import.",
         "It affects any feature that downloads a URL, such as a link preview or an import. Section 5 of [the most common web attacks](/en/blog/common-web-attacks) reproduces it and fixes it."),
    ],
    B + 'revisar-codigo-generado-por-ia/es.mdx': [
        ("Esta última incluye el límite de intentos de inicio de sesión.",
         "Esta última incluye el límite de intentos de inicio de sesión. [Los ataques web más comunes](/es/blog/ataques-web-comunes) reúne estos fallos con otros ataques frecuentes, como el SSRF y la inyección de órdenes."),
    ],
    B + 'revisar-codigo-generado-por-ia/en.mdx': [
        ("The last one includes the login attempt limit.",
         "The last one includes the login attempt limit. [The most common web attacks](/en/blog/common-web-attacks) brings these failures together with other frequent attacks, such as SSRF and command injection."),
    ],
}
for p, reps in edits.items():
    s = open(p, encoding='utf-8').read()
    for a, b in reps:
        assert s.count(a) == 1, (p, a[:50])
        s = s.replace(a, b)
    open(p, 'w', encoding='utf-8', newline='').write(s)
print('ok')
