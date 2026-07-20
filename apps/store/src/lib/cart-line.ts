// Clave de línea del carrito: un producto con talle ocupa una línea por
// talle. Ítems sin talle (productos simples o carritos persistidos viejos)
// conservan el id como clave — cero migración.
export function cartLineKey(item: { id: string; size?: string }): string {
  return item.size ? `${item.id}::${item.size}` : item.id;
}
