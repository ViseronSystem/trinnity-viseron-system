# Decisão Arquitetural: Reality Hardening — Alinhar Documentação com Funcionamento Real

**ID:** `decision-reality-hardening`  
**Data:** 2026-08-11  
**Tipo:** Architectural Decision — Correction Plan  
**Estado:** Proposta — aguarda aprovação  
**Autoria:** © Pedro Costa (Comandante) · Trinnity Hurtado (Rainha)  
**Base:** Deep Audit Phases 7-16 (`e0f0986`)

---

## 1. Contexto

A auditoria profunda (16 fases) revelou 6 divergências críticas entre o que o sistema **documenta** e o que **realmente faz**:

| Divergência | Documentado como | Realidade |
|------------|-----------------|-----------|
| IntelligenceLevel | "Inteligência do sistema" | `min(level * 1.05, 1000000)` — juro composto |
| Planner | "Planeamento autónomo" | 7 templates em loop infinito, 497/500 texto idêntico |
| Capabilities | "Capacidades dos agentes" | `Math.random()` escolhe de lista de strings fantasiosos |
| VAEC | "Pipeline de evolução com gates" | Stage = FAILED desde 00:14 |
| Wisdom | "Sabedoria acumulada" | `capabilities.length * 5 + random` |
| Agent Evidence | "Agentes executam e aprendem" | Sem registo do que cada agente realmente fez |

**Esta decisão não remove funcionalidades.** Corrige métricas para refletir a verdade e propõe melhorias para torná-las reais.

---

## 2. Decisão

**Alinhar 6 sistemas com a realidade operacional.** Onde o sistema tem um placeholder, declará-lo como placeholder. Onde tem uma métrica falsa, substituí-la por uma real. Onde não tem evidência, criar o mecanismo de evidência.

---

## 3. Regras de Preservação

1. Nenhuma funcionalidade existente será removida
2. Nenhum dado real será apagado
3. Todas as correções são incrementais (adicionar, não substituir)
4. Cada correção gera evidência testável
5. Zero dados falsos — se não é real, diz "placeholder"
6. Documentação atualizada junto com cada correção

---

## 4. Plano de Correção (6 sistemas)

Ver documento completo: `data/audit/VISERON_REALITY_HARDENING_PLAN.md`

---

*Decisão registada por Pedro Costa (Comandante) e Trinnity Hurtado (Rainha).*  
*© TVS v5.0 · 2026-08-11*
