// Imagen de respaldo cuando una subasta no tiene foto o la URL falla.
export const FALLBACK_IMAGE = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="100%" height="100%" fill="#192030"/>' +
  '<text x="50%" y="52%" fill="#8a93a8" font-family="sans-serif" font-size="32" text-anchor="middle">Sin imagen</text></svg>')
