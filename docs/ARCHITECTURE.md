# ARCHITECTURE — Trinnity Viseron System

> **VISERON — Autonomous AI Operating System & Intelligence Infrastructure**
> Command: **Pedro Costa (Supreme Commander)** · Chief Evolution Officer: **Trinnity Hurtado**
> © 2026 Trinnity Viseron System · www.trinnityviseronsystem.io · GitHub

---

## 1. Princípio de Arquitetura

O VISERON é uma **infraestrutura operacional de inteligência autônoma**: coordena agentes especializados, memória persistente, conhecimento estruturado (Graphify), auditoria (AIOX), ferramentas, integrações empresariais e múltiplos modelos de IA dentro de uma única arquitetura.

Componentes externos **fornecem capacidades — não substituem o núcleo de comando**.

O núcleo do VISERON fornece: **identidade · governança · autorização · memória · orquestração · auditoria · avaliação · segurança · evolução · continuidade.**

## 2. Hierarquia de Comando

```text
PEDRO (Supreme Commander)
   ↓
TRINNITY (Chief Evolution Officer)
   ↓
VISERON CORE
   ↓
AIOX (auditoria) · GRAPHIFY (conhecimento) · MEMORY (experiência)
   ↓
ORCHESTRATION LAYER → AGENTS · SKILLS · TOOLS
   ↓
EXECUTION ENGINE → BUSINESS AUTOMATION → CLIENT SYSTEMS
```

AIOX e Graphify atuam sobre o Core como camadas de avaliação e conhecimento — nunca como camadas de comando.

## 3. Camadas do Sistema

### 3.1 Núcleo Cognitivo (`core/` + `packages/aiox-core/`)
- **Model Routing Layer**: roteamento multi-modelo (Ollama local, OpenAI, Anthropic, Gemini, Grok, DeepSeek, Mistral, OmniRoute 300+ provedores, modelos privados) por qualidade, custo, latência, contexto, privacidade, disponibilidade e capacidade especializada.
- **Memory Engine**: memória de curto prazo → memória de trabalho → memória de longo prazo → conhecimento → grafo/relacionamentos.
- **Governança**: cada operação é avaliada por princípios éticos e políticas de domínio antes de executar.

### 3.2 Orchestration Layer (`src/core/`)
- **AgentManager**: agentes com Identidade, Papel, Objetivo, Memória, Skills, Ferramentas, Permissões, Contexto, Políticas, Estado e Avaliação. Criação, substituição, isolamento e desativação sem parar o sistema.
- **ToolManager**: ferramentas internas + externas + MCP + integrações empresariais.
- **SkillsRegistry**: skills indexadas de coleções vendidas.
- **TaskQueue (OMEGA)**: pipeline E2E persistente `CREATED → PLANNING → QUEUED → RUNNING → VERIFYING → COMPLETED` (+ `FAILED → RECOVERING → retry`). Tasks sobrevivem a restart.
- **EventBus (OMEGA)**: backbone reativo — tópicos, wildcards (`task.*`), filtro por fonte, retry, isolamento de handlers, histórico ring buffer.

### 3.3 AutonomyOS (`src/omega/autonomy/`)
Autonomia graduada L0–L5 aplicada por **domínio · risco · ferramenta · agente · cliente · política · operação**:

```text
L0 OBSERVE · L1 SUGGEST · L2 APPROVE · L3 EXECUTE · L4 SUPERVISED · L5 AUTHORIZED
```

Políticas por domínio (finance, deploy, data, messaging, agents, research, system) com `denyFor` / `requireApprovalFor` / `denyAbove` / `approvalFrom` / `autoBelow`. **Autonomia sem auditoria é risco** — cada decisão fica auditada.

### 3.4 Auditoria e Conhecimento
- **AIOX** (`packages/aiox-core/`, `src/core/`): auditoria e avaliação contínua — "Estamos realmente melhorando?". Cobre código, arquitetura, agentes, ferramentas, memória, desempenho, segurança, regressões, dependências, mudanças de comportamento, qualidade e eficiência.
- **Graphify** (`graphify-out/`): camada de conhecimento estrutural — nós, arestas, comunidades, relações cross-file. Componente independente integrado ao ecossistema por contratos próprios.

### 3.5 Operação e Observabilidade
- **SEE VISERON OPERATE** (`/operate`): pipeline `INTENT → PLAN → AUTHORIZE → EXECUTE → VERIFY` visível em tempo real (stream SSE).
- **Command Center** (`/command-center`): saúde do sistema, autonomia, receita, agentes, execução, conhecimento, operações, integrações, atividade, evolução.
- **JARVIS** (`/api/jarvis/*`): superintendente com voz, memória persistente e supervisão contínua.
- **ATLAS** (`/atlas`): tutor de inglês com voz (7 dias, método imersivo).

### 3.6 Integrações Empresariais (`src/integrations/`)
Cada integração implementa `IntegrationBridge` (`name`, `initialize()`, `status()`, `stop()`) e é registada no `SuperIntegration` (viseron-apps, omniroute, call-system, openjarvis, asno, avirato, n8n, webhook, rest-api).

**Princípio: integração máxima dentro da permissão mínima necessária.** Ex.: `AviratoBridge` expõe readiness, planos e MRR — nunca toca dados de cartão.

### 3.7 Interfaces
Web dashboard (`src/dashboard/public`), mobile (Expo Android/iOS), desktop (Electron), CLI, REST API, MCP, integrações e automações.

## 4. Distribuição de Responsabilidades (estado atual)

| Componente | Papel |
|---|---|
| **GitHub** (`ViseronSystem/trinnity-viseron-system`) | Fonte de verdade do código |
| **Servidor EPYC 7542 / 256 GB / Windows Server 2025** | **Primary Node** — ambiente principal de desenvolvimento + execução |
| **Servidor antigo** | Fallback temporário até transferência completa validada |
| **AIOX** | Auditoria |
| **Graphify** | Conhecimento / estrutura |
| **Pedro + Trinnity** | Comando / orquestração |

## 5. Qualidade e Validação

Quality gates antes de promover qualquer alteração importante:

```bash
npm test        # OMEGA 192/192 · CORE 20/20 · WEB 109/109
npm run lint    # tsc --noEmit limpo
npm run build
```

A infraestrutura também valida: runtime, integrações, memória, autonomia, APIs, ferramentas, agentes, segurança, persistência e recuperação. **Código que não passa as verificações não é promovido ao Primary Node.**

## 6. Decisões Estruturais (ADR simplificado)

- **Não congelar desenvolvimento para migrar.** O GitHub é fonte de verdade; a migração acompanha o desenvolvimento.
- **Não criar infraestrutura de migração futura hipotética.** Construir migrações funcionais, aprender com cada uma e automatizar progressivamente (MIGRAÇÃO 1 → N).
- **Não distribuir prematuramente.** Primary Node confiável primeiro; multi-node/regional/distribuído só depois de uma base sólida.
- **Portabilidade é requisito estrutural, não projeto separado.** O VISERON não depende da vida útil de uma máquina.
