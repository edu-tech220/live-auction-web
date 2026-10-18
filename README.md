# ⚡ Live Auction · Web

[![CI](https://github.com/edu-tech220/live-auction-web/actions/workflows/ci.yml/badge.svg)](https://github.com/edu-tech220/live-auction-web/actions/workflows/ci.yml)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![SignalR](https://img.shields.io/badge/SignalR-WebSockets-0A7BBB)
![License](https://img.shields.io/badge/license-MIT-green)

Frontend de **Live Auction**, una plataforma de subastas en tiempo real. Los precios, las pujas, los
espectadores y el resultado final llegan en vivo por **SignalR**, sin recargar la página.

API y lógica de negocio: **[edu-tech220/live-auction](https://github.com/edu-tech220/live-auction)** (ASP.NET Core + SignalR + SQL Server).

![Subasta en vivo](docs/images/auction.png)

## Lo interesante

- **Una sola conexión SignalR** para toda la app (`RealtimeProvider`), que se recrea al iniciar o
  cerrar sesión para que el servidor vea la identidad correcta.
- **Los eventos en vivo actualizan la caché de React Query**, no un estado paralelo: REST y SignalR
  alimentan la misma fuente (`setQueryData` con funciones puras de `lib/auctionState.ts`).
- **Eventos desordenados o duplicados no rompen la UI.** `bidCount` funciona como número de
  secuencia y un evento viejo nunca "baja" el precio.
- **Reconexión con resincronización.** Al reconectar, cada pantalla vuelve a unirse a su grupo y
  `JoinAuction` devuelve el estado actual; lo que pasó mientras no había conexión se recupera.
- **Sin reglas de negocio críticas en el cliente.** El navegador solo manda el monto; el servidor
  decide si es válido, quién va ganando y cuándo termina la subasta. La cuenta regresiva se corrige
  con el reloj del servidor, pero es solo visual.
- **Rechazos privados.** Si tu oferta es inválida, solo tú ves el motivo (`BidRejected` va al
  invocador). Si alguien te supera, recibes un aviso.

## Funcionalidades

| Pantalla | Qué hace |
|---|---|
| Catálogo | Filtros (en vivo, próximas, finalizadas), búsqueda, precios y ofertas en vivo |
| Subasta | Precio en vivo con animación, cuenta regresiva, montos sugeridos, historial en vivo, espectadores y resultado final |
| Mis pujas | Si vas ganando, te superaron, ganaste o perdiste |
| Administrar | Crear y cancelar subastas (solo rol Admin) |
| Login / Registro | Sesión con JWT; cierre automático al expirar el token |

## Stack

React 19 · TypeScript (strict) · Vite 8 · React Router · TanStack Query · `@microsoft/signalr` ·
Tailwind CSS 4 · Vitest + Testing Library · oxlint · Docker (Nginx) · GitHub Actions

## Ejecutar

Requisitos: Node 24+ y la [API](https://github.com/edu-tech220/live-auction) corriendo.

```bash
npm install
cp .env.example .env     # VITE_API_URL=http://localhost:5080
npm run dev              # http://localhost:5173
```

> Si corres la API con el perfil **https** de Visual Studio, usa `VITE_API_URL=https://localhost:7080`.
> La API ya permite el origen `http://localhost:5173` por CORS en desarrollo.

Con Docker (la URL de la API se incluye en el build):

```bash
docker build --build-arg VITE_API_URL=http://localhost:5080 -t live-auction-web .
docker run -p 8080:80 live-auction-web   # http://localhost:8080
```

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm test` | Pruebas (Vitest + Testing Library) |
| `npm run typecheck` | TypeScript estricto |
| `npm run lint` | oxlint |
| `npm run build` | Build de producción en `dist/` |

## Pruebas

**32 pruebas** de unidad y componentes:

- `lib/auctionState`: aplicar eventos en vivo, ignorar duplicados y desordenados, no "revivir" una subasta finalizada.
- `lib/api`: se envía el JWT y **solo el monto**, ProblemDetails → `ApiError` con `code`, un 401 cierra la sesión, error de red.
- `lib/format`: cuenta regresiva con desfase del servidor, moneda.
- Componentes: panel de puja (sugerencias, no bloquea montos bajos, vendedor y sin sesión), resultado final, tarjeta.

Además se probó de punta a punta con dos navegadores reales contra la API (pujas en vivo,
rechazo solo para quien pujó, aviso de "te superaron", espectadores, cierre con ganador).

## Estructura

```
src/
  auth/        AuthContext (sesión, login, expiración) y almacenamiento de la sesión
  realtime/    RealtimeProvider (conexión SignalR) y hooks useAuctionRoom / useLobby
  lib/         cliente de la API, tipos del contrato, funciones puras de estado, formato
  components/  Layout, AuctionCard, BidPanel, historial, resultado, UI
  pages/       Home, Auction, Auth, MyBids, Admin
```

## Capturas

| Catálogo | Resultado final |
|---|---|
| ![Catálogo](docs/images/home.png) | ![Finalizada](docs/images/finished.png) |

| Mis pujas | Administración |
|---|---|
| ![Mis pujas](docs/images/mybids.png) | ![Admin](docs/images/admin.png) |

| Login | Móvil |
|---|---|
| ![Login](docs/images/login.png) | ![Móvil](docs/images/mobile.png) |

## License

[MIT](LICENSE)
