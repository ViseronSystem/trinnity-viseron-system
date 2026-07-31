# Viseron Skills Library

Módulo de skills de **Trinnity Viseron System** que integra colecciones externas de Agent Skills (formato estándar `SKILL.md`). La capa de integración (registro, CLI, API REST y documentación) es **de autoría Viseron**; el contenido original de cada colección se preserva íntegro en `skills/vendor/` con su licencia y autor original.

## Colecciones integradas

| Colección | Origen | Licencia | Skills |
|-----------|--------|----------|--------|
| `awesome-claude-skills` | [ComposioHQ/awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills) | Apache-2.0 | ~864 |
| `superpowers` | [obra/superpowers](https://github.com/obra/superpowers) | MIT | ~14 |
| `claude-plugins-official` | [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official) | Apache-2.0 | ~31 |
| `marketingskills` | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) | MIT | ~49 |

Total: **~950 skills** (958 en la instalación actual). El directorio `skills/vendor/` está en `.gitignore`: se instala de forma autónoma con el comando de abajo.

## Instalación autónoma

```bash
npm run skills:install
```

Instala o actualiza (`git pull --ff-only`) las 4 colecciones en `skills/vendor/`, preservando sus `LICENSE`. Muestra al final el resumen de skills indexadas por colección.

## CLI

```bash
npm run skills -- list                  # Lista todas las skills
npm run skills -- list --source superpowers
npm run skills -- search cro            # Busca por texto en nombre/descripción
npm run skills -- search cro --source marketingskills
npm run skills -- info marketingskills:cro   # Muestra el SKILL.md completo
```

Equivalencias: `npm run skills:list`, `npm run skills:search -- <query>`, `npm run skills:info -- <id>`.

## API REST (dashboard)

Servidas por `TVSDashboardServer` (`src/dashboard/server.ts`):

- `GET /api/skills` — lista de skills (`?source=` y `?q=` para filtrar).
- `GET /api/skills/stats` — total y desglose por colección con licencias.
- `GET /api/skills/:id` — detalle completo (metadatos + cuerpo `SKILL.md`).

## Módulo

- `src/core/skills/SkillsRegistry.ts` — registro, escáner de `SKILL.md`, parser de frontmatter, búsqueda.
- `src/core/skills/index.ts` — exports públicos.
- `scripts/skills.ts` — CLI con Commander (`install`, `list`, `search`, `info`).

Los agentes de TVS indexan solo `name` + `description` por skill (~100 tokens) y cargan el cuerpo completo bajo demanda, igual que el estándar de Agent Skills.
