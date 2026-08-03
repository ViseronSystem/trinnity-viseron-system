# VISERON — Certificado de Autoría e Propriedade

**Sistema:** Trinnity Viseron System v5.0
**Repositório de inspiração:** https://github.com/Shubhamsaboo/awesome-llm-apps (Apache-2.0)
**Data de consolidação:** 2026-08-03

## Autores e Donos

| Nome | Cargo | Clearance | Domínio |
|------|-------|-----------|---------|
| **Pedro Costa** | Comandante Supremo & Criador (TVS Creator) | `tvs_creator` | Autoridade absoluta, criação, acesso ilimitado |
| **Trinnity Hurtado** | Rainha & Arquiteta Chefe | `tvs_architect` | Soberania técnica, arquitetura de IA |

Estes são os únicos agentes com clearance de criação (`tvs_creator` / `tvs_architect`) no `CommandChain`.
Todos os squads executivos e de arquitetura são liderados por eles (`squad_executive` → Pedro, `squad_architecture` → Trinnity).

## Como se materializa a autoria no código

- `src/core/leadership/CommandChain.ts` — `pedro` → `tvs_creator`, `trinnity` → `tvs_architect`.
- `src/core/squads/SquadManager.ts` — líderes Pedro e Trinnity com todos os `SYSTEM_ADMIN`.
- `src/core/standard/battalion.ts` — soberanos das linhas `hierro` (Pedro) e `corona` (Trinnity); agente "Ianthe Costa — La Que Firma la Autoría" registra quem fez o quê.
- `agents/registry.json` — comandantes Pedro (estratégia *expansion*) e Trinnity (estratégia *evolution*), 5 squads, 25 agentes.

## Catálogo de Apps LLM (awesome-llm-apps) incorporado

As seguintes 8 aplicações LLM foram portadas como skills de TVS (`skills/vendor/awesome-llm-apps/`), sob licença Apache-2.0 preservada, e ficam sob o comando de Pedro e Trinnity:

1. **Deep Research** — investigação profunda com relatório e fontes.
2. **Local RAG** — RAG 100% local com Qdrant/fallback em memória + Ollama.
3. **Mixture of Agents** — vários modelos respondem, agregador escolhe a melhor.
4. **Multi-Agent Team** — equipa de especialistas que planifica e executa projetos.
5. **Self-Evolving** — o agente reescreve os próprios prompts para melhorar.
6. **Always-On Briefing** — vigia fontes e envia brief diário por email.
7. **Voice RAG** — perguntar aos documentos por voz.
8. **Generative UI** — gera interfaces interativas por linguagem natural.

Cada skill pode ser materializada como mente VISERON pela CODE Platform (`/api/code/create-agent`) e executada (`/api/code/run-agent`).

## Monitorização AIOX

Todo o sistema é monitorizado pelo AIOX (núcleo de 50 anos de experiência coletiva):

- `AutoLearningEngine` — ciclo de aprendizagem contínuo que atualiza `pedro_brain_state` e `trinnity_brain_state`.
- `MemoryEngine` — categoria `AIOX_EXPERIENCE` com a base de conhecimento seminal.
- `AIOX Core Squad` — 7 agentes (orchestrator, planner, evolver, learner, memory, provider, builder).
- Auditoria `npm run audit:arkom` — squads AIOX-1..5 com veredito GO/NO-GO.
- Endpoint de monitorização: `GET /api/code/aiox`.

## Licenças

- **awesome-llm-apps** — Apache-2.0 (conteúdo original preservado como referência de arquitetura; a implementação em TVS é própria).
- Skills de TVS: o frontmatter de cada SKILL.md preserva `source` e `license`.
