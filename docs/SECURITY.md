# SECURITY — Trinnity Viseron System

> **Princípios de segurança, acesso e governança do VISERON**
> Command: **Pedro Costa (Supreme Commander)** · Chief Evolution Officer: **Trinnity Hurtado**
> © 2026 Trinnity Viseron System · www.trinnityviseronsystem.io · GitHub

---

## 1. Princípio Central

> **Least privilege + explicit authorization + auditability.**

Nenhum agente possui automaticamente acesso irrestrito.

Cada capacidade deve considerar: **identidade · domínio · permissão · nível de autonomia · risco · contexto · auditoria · reversibilidade.**

## 2. Autonomia com Controle

O **AutonomyOS** gradua a autonomia (L0–L5) por domínio e risco. A autonomia **não** significa ausência de governança — o objetivo é *mais autonomia com mais controle, evidência e auditabilidade*.

Domínios com políticas dedicadas: `finance`, `deploy`, `data`, `messaging`, `agents`, `research`, `system`. Regras: `denyFor` (bloqueio total), `requireApprovalFor` (aprovação humana), `denyAbove`/`approvalFrom` (limiares monetários), `autoBelow` (autonomia abaixo de valor).

Exemplos:
- **finance**: `card_data_access` e `refund_full` são **negados**; `refund`, `invoice_override` e `plan_downgrade` exigem aprovação; >$50.000 negado; ≥$500 aprovação.
- **deploy**: `prod_down` é negado.
- **Integrações**: `AviratoBridge` expõe readiness/planos/MRR mas **nunca toca dados de cartão** — integração máxima dentro da permissão mínima necessária.

## 3. Segredos

- Segredos (`*KEY`, `*SECRET`, `*TOKEN`, `*AUTH`, `.env`, seeds, chaves privadas) **nunca** no chat, no terminal público, nem em commits.
- `.env`, `contracts/solana-keypair.json`, `contracts/solana-seed.txt`, `contracts/wallets/` e `migracao/` são **gitignored**.
- Cofre de credenciais: `npm run cofre` → `data/Viseron_Cofre_Credenciais.pdf` (CONFIDENCIAL, gitignored).
- Backup obrigatório antes de sobrescrever ficheiros de carteira.

## 4. Acesso e Autenticação

- Registo multi-tenant: org → tenant + owner + JWT (`POST /api/auth/register`).
- Login JWT com rate-limiting.
- Rotas sensíveis exigem `requireAuth`.
- Mensageria E2E cifrada (x25519 + aes-256-gcm) por recetor.

## 5. Pagamentos

- **Avirato Payments** (primário): checkout numa sessão externa — dados de cartão são processados pela Avirato, **nunca pelo TVS**.
- Webhook de pagamento verificado por HMAC.
- Alternativa: Stripe.
- Estado: `GET /api/revenue/readiness` (6/6 pronto).

## 6. Dados Sensíveis

Dados sensíveis permanecem isolados e sujeitos às políticas do domínio. Base 45k telecomunicaciones é dados pessoais (RGPD) — marketing exige base própria/consentimento.

## 7. Código e Dependências

- Código de terceiros não é tratado automaticamente como código proprietário do VISERON.
- Cada dependência é avaliada quanto a: licença, atribuição, redistribuição, dependências, compatibilidade, segurança e obrigações comerciais.
- Não versionar segredos; não introduzir código que exponha ou logue chaves.

## 8. Auditoria (AIOX)

Tudo é auditável por Pedro e Trinnity:
- `data/knowledge/jarvis-memory.jsonl` — operações executadas pelo JARVIS.
- `data/knowledge/viseron-supervision.jsonl` — supervisão contínua do squad AIOX.
- `data/knowledge/call-learned.jsonl` — conhecimento aprendido de chamadas.
- Auditoria ARKOM/AIOX: `npm run audit:arkom`.
