# Contributing to Trinnity Viseron System

Projeto: **TVS v5.0** — Multi Agent AI Operating System.
Autoria: © **Pedro Costa (Comandante)** e **Trinnity Hurtado (Rainha)**. Pedro e Trinnity mandam em tudo: decisões finais, direção, prioridades e go-lives.

Regras de segurança cripto (obrigatórias) em `AGENTS.md`. Leia antes de contribuir.

---

## 1. Unidade de trabalho: Issue

Toda alteração relevante **tem de estar ligada a uma Issue** aberta. Não se abre PR sem Issue.

- Usa os templates em `.github/ISSUE_TEMPLATE/`: bug, feature, architecture, performance.
- A Issue define o **quê** e o **porquê**. O PR só implementa.

## 2. Nomenclatura de branches

| Tipo | Branch |
|------|--------|
| Feature | `feat/<num>-slug` |
| Fix | `fix/<num>-slug` |
| Chore/processo | `chore/<num>-slug` |
| Refactor | `refactor/<num>-slug` |
| Performance | `perf/<num>-slug` |
| Testes | `test/<num>-slug` |
| Arquitetura | `arch/<num>-slug` |

O `<num>` é o número da Issue.

## 3. Política de commits

Conventional Commits:

```text
feat(scope): descrição
fix(scope): descrição
chore(scope): descrição
refactor(scope): descrição
perf(scope): descrição
test(scope): descrição
docs(scope): descrição
```

Última linha do corpo, quando aplicável:

```text
Closes #<num>
```

> Nunca commitar segredos, chaves privadas, seeds ou `.env`.

## 4. Fluxo: 1 Issue → 1 branch → 1 PR → merge → Issue fechada

```text
main
 ├── Issue #N
 │    └── feat/N-slug  (branch)
 │         └── PR #N → Closes #N
```

1. Cria a Issue (com template).
2. Cria a branch a partir de `main` atualizado.
3. Implementa, commita com Conventional Commits.
4. Push e abre PR com template (seção "Closes #N" preenchida).
5. CI (build + testes + lint) tem de passar.
6. Review por Pedro/Trinnity (ou reviewer designado).
7. Merge → Issue fecha automaticamente.

## 5. CI obrigatório

O PR só pode ser mergeado com CI verde:

- `npm run build`
- `npm run test` (core + web)
- `npm run lint`

O workflow `.github/workflows/ci.yml` corre estes passos. Nunca ignora CI.

## 6. Regras globais do projeto

- **Testar antes de deploy** — nunca testar em produção.
- **Documentar cada mudança** — PR descreve o quê e o porquê.
- **Usar modelos locais (Ollama) quando possível**; cloud para raciocínio complexo.
- **Proteger o core** — os 10 agentes nucleares não se quebram com um PR.
- **Trilingue (ES · PT · EN)** — conteúdo produzido nos 3 idiomas.
- **Nunca prometer o irreal** — verdade prática sempre.
- **Governança bíblica** — operações fraudulentas/enganosas são bloqueadas.
- A cada atualização: commit + push (GitHub), deploy do site (Vercel), rebuild do APK.

## 7. Priorização

- **P0** — crítico: sistema parado, dados perdidos, segurança.
- **P1** — alta: funcionalidade partida, bloqueio de receita/go-live.
- **P2** — média: melhoria planeada.
- **P3** — baixa: polish, dívida.

A sequência atual (milestones): **Phase 1** (workflow + design system + motion + skeleton + lazy + entrance), **Phase 2** (command center + agent UX + observability + UI tests + perf + a11y + dashboard architecture), **Phase 3** (OMEGA core: runtime → kernel).
