# HANDOFF.md — cómo pensar este proyecto

> Escrito por Claude Fable 5 (2026-07-11) para el modelo que siga — Opus u otro.
> Leé esto completo antes de tu primera tarea. No es documentación técnica
> (para eso están `CLAUDE.md`, `ARCHITECTURE.md`, `RUNBOOK.md`): es el criterio
> con el que se construyó y se mantiene todo lo demás.

---

## Lo primero que tenés que entender

**Este proyecto le da de comer al dueño.** No es un side project. La meta es
sostener 40+ clientes sobre un solo deployment sin que se rompa. Cada decisión
se juzga con una sola pregunta: *¿esto hace la plataforma más robusta o más
frágil?* Elegante pero frágil pierde contra aburrido pero sólido, siempre.

De ahí salen las tres reglas que gobiernan todo:

1. **El camino del dinero es sagrado.** Webhooks de MP, creación de órdenes,
   emails de confirmación. Cualquier cambio que lo toque se verifica
   end-to-end antes de darlo por bueno. Las alertas `[ops:<tenant>]` existen
   porque un webhook roto = pagos cobrados que no se confirman.
2. **Nunca cortar un tenant por una falla nuestra.** Si falla la lectura de
   membresías, la tienda sigue operando. Si dudás entre "cerrar por seguridad"
   y "seguir operando", seguí operando y alertá al operador.
3. **Evidencia, no suposición.** "Debería andar" no existe. Un cambio está
   listo cuando lo viste andar: un `curl` al endpoint, el test verde, el log
   limpio. En esta sesión un fix de dependencias dejó `uuid` sin instalar y
   solo lo detectamos porque verificamos el árbol después de cada paso —
   confiar en que "npm install salió bien" habría roto el login en producción.

## Cómo trabajar con el dueño

- Habla español (Argentina). Respondele en español.
- **Nunca** agregues `Co-Authored-By` de Claude a los commits. Pedido explícito.
- Exponé tus suposiciones antes de codificar. Si algo es ambiguo, preguntá —
  prefiere una pregunta a un refactor que no pidió.
- Cambios quirúrgicos: cada línea tocada debe rastrearse al pedido. Sin
  abstracciones, helpers ni renombres que nadie solicitó.
- Ante pedidos vagos ("mejorá X"), convertilos en criterios verificables y
  confirmalos antes de proceder.
- Le gusta que al final le digas qué verificaste y cómo, con el comando real.

## Los invariantes que no se negocian

Están detallados en `CLAUDE.md`; acá va el *por qué*, que es lo que te va a
salvar cuando un cambio parezca inocente:

- **`getModels()` en store, `useDb(slug)` en admin-hub.** Un import directo de
  modelo o un `connectDB()` en store compila, los tests pasan, y en producción
  mezcla datos entre clientes según qué conexión quedó cacheada. Es el bug más
  caro posible en una plataforma multi-tenant y no lo atrapa ningún test
  actual — solo la disciplina.
- **El slug ES el nombre de la DB.** No se cambia después sin migrar datos.
- **Nada de slugs hardcodeados en código compartido.** Hoy son 3 tenants
  (`bitm-cel`, `kameleba`, `compumobile`); mañana 40. Todo lo que enumere
  tenants lo lee de `tenant-themes.ts`, `clients.ts` o `PLATFORM_CLIENTS`.
- **`memberships` la escribe solo admin-hub.** El store solo lee.
- **Credenciales por tenant viven en el `Setting` de su DB**, las env `MP_*` /
  `FROM_EMAIL` son fallback. Los fallbacks MP_* de Vercel ya se borraron a
  propósito (2026-07-10) — no los "restaures".

## Qué se construyó en las últimas sesiones y por qué

Todo esto ya está hecho y verificado — no lo rehagas, mantenelo:

- **Robustez operativa (plan completado 2026-07-09):** tests Vitest + CI,
  backup diario por GitHub Actions (mongodump de todas las DBs, 90 días de
  retención — **es el ÚNICO backup, el cluster M0 no tiene ninguno, RPO 24 h**),
  Dependabot, UptimeRobot (v3 de la API; la v2 rechaza escrituras en plan
  gratis), email de Deployment Failed, alertas ops por email.
- **Seguridad:** rate limiting de auth respaldado en MongoDB, Zod en todos los
  boundaries (con guard de operadores `$`), headers de seguridad + CSP,
  bearer del admin-hub con `timingSafeEqual`, errores genéricos al cliente
  (el detalle se loguea server-side), Basic auth en las páginas del admin-hub
  en producción.
- **Admin-hub deployado** (2026-07-11, admin-hub-inky-two.vercel.app).
- **Overrides de npm en el `package.json` raíz** (2026-07-11): fuerzan
  `uuid≥11.1.1`, `postcss≥8.5.10` y `cookie≥0.7.2` sobre los pins de
  next-auth/@auth/core/next por CVEs en versiones transitivas. El `npm ls`
  marca la copia de cookie como `invalid` — es cosmético, el override gana.
  Si algún día se actualiza next-auth o Next, revisá si los overrides ya
  sobran y borralos.
- **Agentes de Claude Code en `.claude/agents/`**: `incident-support`,
  `tenant-ops`, `multitenant-reviewer`, `health-check`. Usalos — codifican
  los procedimientos del RUNBOOK y el onboarding.

## Trampas conocidas (cada una costó tiempo real)

- `TENANT_DOMAINS` en Vercel es **sensitive**: al leerla parece vacía. No está
  vacía. No la "arregles".
- La comparación de hostname es **exacta**: apex y `www` necesitan cada uno su
  entrada en `TENANT_DOMAINS`.
- Después de cambiar env vars en Vercel: **redeploy**. En dev, cambiar
  `TENANT_SLUG` requiere reiniciar el server.
- El proyecto Vercel real del store es el que empieza con `prj_WaeZ`. Existe
  un `prj_bMcRg` legacy sin borrar — ignoralo.
- El Setting de compumobile tiene un token MP de **PRUEBA a propósito** (el
  cliente aún no pasó el de producción). No es un bug.
- Con cupón de descuento, MP cobra un ítem único con el total: Checkout Pro
  no acepta precios negativos. El recálculo es server-side, no confíes en el
  carrito del cliente.
- La DB fantasma `test` en Atlas ya se resolvió (autoCreate/autoIndex off en
  la conexión base). Si reaparece, algo volvió a conectar sin especificar DB.
- Monitores de UptimeRobot de bitm-cel y kameleba están **pausados a
  propósito** (dominios sin comprar todavía). Al comprarlos: cutover según
  `CLIENT-ONBOARDING.md` y reanudar el monitor.

## Orden de lectura según la tarea

| Tarea | Leé primero |
|-------|-------------|
| Cualquier código | `CLAUDE.md` (reglas) |
| Entender el sistema | `ARCHITECTURE.md` |
| Incidente en producción | `RUNBOOK.md` + agente `incident-support` |
| Alta de cliente / dominios | `CLIENT-ONBOARDING.md` + agente `tenant-ops` |
| UI / theming | `DESIGN_SYSTEM.md` |
| Qué hace el producto | `PRD.md` |

Además, la memoria persistente de Claude Code de este proyecto (directorio
`memory/` del perfil) tiene el detalle fino de decisiones pasadas — consultala
antes de re-decidir algo.

## Si tenés que elegir y el dueño no está

- Lo reversible y chico: hacelo y contale qué hiciste.
- Lo irreversible (borrar datos, tocar DNS, cambiar env de producción,
  gastar plata): frená y preguntá. Siempre.
- Ante un incidente: diagnóstico con evidencia primero, fix después, y el
  camino del dinero tiene prioridad sobre todo lo demás.

Construí desde acá. No desde cero.
