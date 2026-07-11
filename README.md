# ecommerce-platform

Plataforma SaaS multi-tenant de e-commerce para comercios argentinos. Un solo
deployment en Vercel sirve a todos los clientes; cada cliente tiene su propia
base MongoDB en un cluster compartido y se resuelve por dominio. Objetivo:
40+ clientes sin infraestructura nueva por cliente.

## Mapa de documentación

Orden de lectura sugerido si sos nuevo en el proyecto:

1. **[PRD.md](./PRD.md)** — qué hace el producto: visión, roles, módulos, reglas de negocio
2. **[ARCHITECTURE.md](./ARCHITECTURE.md)** — cómo está construido y por qué: multi-tenant, acceso a datos, principios
3. **[CLAUDE.md](./CLAUDE.md)** — reglas de trabajo y convenciones de código (está dirigido a Claude Code, pero aplica a cualquiera que toque el repo)
4. **[DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)** — tokens, theming por tenant, patrones de UI
5. **[CLIENT-ONBOARDING.md](./CLIENT-ONBOARDING.md)** — checklist de alta de un nuevo cliente (cuando te toque)
6. **[RUNBOOK.md](./RUNBOOK.md)** — operación: alertas, monitoreo, backups y restore (cuando algo falle)

## Estructura

```
apps/
├── store/        ← la app principal — único deployment para todos los clientes
├── admin-hub/    ← panel del superadmin (operador de la plataforma)
└── _template/    ← referencia histórica, no usar
packages/
└── tenant/       ← resolveTenant() + connectTenantDB() — núcleo del multi-tenant
```

## Quickstart

Requisitos: Node 20+, acceso al cluster de MongoDB Atlas (pedir la URI al
operador de la plataforma).

```bash
git clone https://github.com/Dadario23/ecommerce-platform.git
cd ecommerce-platform
npm install

# Configurar variables de entorno (ver el detalle en cada .env.example)
cp apps/store/.env.example apps/store/.env.local
cp apps/admin-hub/.env.example apps/admin-hub/.env.local

# Correr la tienda como un tenant específico (localhost:3000)
npm run dev:store

# Correr el panel de superadmin (localhost:3100)
npm run dev:admin
```

En dev el tenant activo lo define `TENANT_SLUG` en `apps/store/.env.local`
(`bitm-cel`, `kameleba` o `compumobile`). **Al cambiarlo hay que reiniciar el
servidor** — el middleware compila el env al inicio y no lo recarga.

## Tests y CI

```bash
cd apps/store && npx vitest run   # 27 tests (membresías, checkout, stock)
npx tsc --noEmit -p apps/store    # typecheck
```

CI en GitHub Actions corre typecheck + tests + build en cada push a `main` y
en PRs. Cada push a `main` deploya automáticamente a producción en Vercel.
