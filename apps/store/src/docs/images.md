### 📄 `docs/images.md`

```md
# Manejo de imágenes en Next.js

## Regla principal

Siempre que se use `next/image` con una URL externa:

1. Identificar el dominio
2. Agregarlo en `next.config.js`
3. Reiniciar el servidor

## Dominios actualmente permitidos

- "www.perozzi.com.ar", "www.rodo.com.ar", "i.pinimg.com"

## Error común

"Invalid src prop on next/image"

➡️ El dominio no está autorizado.
```
