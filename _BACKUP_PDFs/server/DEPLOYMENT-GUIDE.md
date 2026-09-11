# VISERON™ Deployment Guide
# Passo-a-passo: PC Principal → Novo Servidor 24/7
# © Pedro Costa · Trinnity Hurtado — VISERON™

## Arquitetura

```
┌─────────────────────┐          SSH Tunnel          ┌─────────────────────┐
│   PC PRINCIPAL      │ ◄══════════════════════════► │   SERVIDOR 24/7     │
│   (não 24h)         │     sync a cada 30min         │   ES-MAD1           │
│                     │                               │   16CPU 128GB 500GB │
│ • Código fonte      │                               │ • VISERON Core      │
│ • Histórico         │                               │ • Ollama (IA local) │
│ • Arquivos cripto   │                               │ • Qdrant (vectors)  │
│ • Wallets           │                               │ • PostgreSQL        │
│ • Desenvolvimento   │                               │ • Dashboard         │
│                     │                               │ • APIs              │
│   C:\Trinnity-      │                               │   C:\viseron        │
│   Viseron-System    │                               │                     │
└─────────────────────┘                               └─────────────────────┘
```

---

## Pré-requisitos (no PC Principal)

1. **SSH client** — OpenSSH (já vem no Windows 10/11)
2. **rsync** — Git Bash ou WSL (para sync rápido)
3. **Chave SSH** — Gerada pelo `tunnel-setup.ps1`

---

## FASE 1: Preparar o Pacote de Deploy

### No PC Principal:
```powershell
# Navegar até o projeto
cd C:\Trinnity-Viseron-System

# Gerar ZIP com tudo
powershell -File server\build-deploy-package.ps1
```

**Resultado:** `C:\Trinnity-Viseron-System\viseron-deploy-YYYYMMDD-HHMMSS.zip`

---

## FASE 2: Preparar o Servidor

### No PC Principal:
```powershell
# Editar IP do servidor no script
notepad server\setup-server.ps1
# Mudar: $VISERON_HOME = "C:\viseron" (já está correto)

# Copiar script para o servidor
scp server\setup-server.ps1 Administrator@IP_SERVIDOR:C:\setup-server.ps1
```

### No Servidor (conectar via RDP ou SSH):
```powershell
# Executar setup
powershell -ExecutionPolicy Bypass -File C:\setup-server.ps1
```

**Isso instala:**
- Node.js 22 LTS
- Ollama + 4 modelos (qwen2.5:3b, qwen2.5:14b, llama3:8b, all-minilm:l6-v2)
- PostgreSQL 16 + banco viseron + 7 tabelas
- Qdrant (vector database)
- Firewall rules
- Task Scheduler (auto-start no boot)

---

## FASE 3: Subir o Código

### No PC Principal:
```powershell
# Copiar ZIP para o servidor
scp viseron-deploy-*.zip Administrator@IP_SERVIDOR:C:\

# Conectar ao servidor
ssh Administrator@IP_SERVIDOR
```

### No Servidor:
```powershell
# Extrair código
Expand-Archive C:\viseron-deploy-*.zip -DestinationPath C:\viseron -Force

# Editar .env com suas chaves
notepad C:\viseron\.env
# Adicionar: OPENAI_API_KEY, ANTHROPIC_API_KEY, etc.

# Instalar dependências
cd C:\viseron
npm install

# Build
npm run build

# Testar
npm start
# Deve abrir na porta 32123

# Parar teste
Ctrl+C
```

---

## FASE 4: Configurar Conexão Direta (PC ↔ Servidor)

### No PC Principal:
```powershell
# Gerar chave SSH e configurar túnel
powershell -File server\tunnel-setup.ps1

# Iniciar sync automático
powershell -File server\sync-bridge.ps1
```

**Resultado:**
- Túnel SSH ativo: `localhost:32123` → Servidor
- Sync a cada 30 minutos
- Acesso ao dashboard: `http://localhost:32123`

---

## FASE 5: Ativar Auto-Start no Servidor

### No Servidor (já feito pelo setup, mas verificar):
```powershell
# Verificar Task Scheduler
Get-ScheduledTask -TaskName "VISERON-*"

# Testar auto-start
powershell C:\viseron\start-viseron.ps1

# Verificar saúde
curl http://localhost:32123/api/health
```

---

## FASE 6: Migração de Dados do Servidor Antigo

### No PC Principal:
```powershell
# Editar IP do servidor antigo
notepad server\migrate.ps1
# Mudar: $OLD_SERVER = "194.62.97.30"

# Executar migração
powershell -File server\migrate.ps1
```

### No Servidor:
```powershell
# Importar banco de dados (se existir)
psql -U postgres viseron < C:\viseron-migration\viseron-db.sql

# Rebuild após dados importados
cd C:\viseron
npm run build
```

---

## Comandos Úteis

### No PC Principal:
| Comando | O que faz |
|---------|-----------|
| `powershell -File server\sync-bridge.ps1` | Inicia sync automático |
| `powershell -File server\tunnel-setup.ps1` | Configura túnel SSH |
| `powershell -File server\build-deploy-package.ps1` | Gera ZIP de deploy |

### No Servidor:
| Comando | O que faz |
|---------|-----------|
| `powershell C:\viseron\start-viseron.ps1` | Inicia todos os serviços |
| `powershell C:\viseron\stop-viseron.ps1` | Para todos os serviços |
| `curl http://localhost:32123/api/health` | Verifica saúde |
| `ollama list` | Lista modelos IA |
| `npm run build` | Rebuild após mudanças |
| `npm start` | Inicia VISERON |

---

## Portas

| Porta | Serviço | Acesso |
|-------|---------|--------|
| 32123 | VISERON Core + Dashboard | Público (firewall) |
| 11434 | Ollama (IA local) | Localhost apenas |
| 6333 | Qdrant (vectors) | Localhost apenas |
| 5432 | PostgreSQL | Localhost apenas |
| 22 | SSH | Público (firewall) |

---

## Troubleshooting

### Servidor não responde:
```powershell
# Verificar serviços
Get-Process ollama, qdrant, node -ErrorAction SilentlyContinue

# Reiniciar tudo
powershell C:\viseron\start-viseron.ps1
```

### Sync falhou:
```powershell
# Verificar log
Get-Content $env:TEMP\viseron-sync.log -Tail 20

# Testar conexão
ssh Administrator@IP_SERVIDOR "echo OK"
```

### Túnel caiu:
```powershell
# Reiniciar túneis
powershell -File server\tunnel-setup.ps1

# Verificar portas
Get-NetTCPConnection -LocalPort 32123
```

---

## Segurança

- **Wallets e seeds** ficam APENAS no PC principal (nunca no servidor)
- **.env** com API keys: cada servidor tem o seu
- **SSH key**: dedicada para sync, sem senha
- **Firewall**: PostgreSQL e Qdrant só acessíveis de localhost
- **Backup criptografado**: sync inclui backup comprimido dos dados sensíveis

---

## Fluxo de Trabalho Diário

1. **PC Principal**: Desenvolver, testar, commit
2. **Sync automático**: Código vai pro servidor a cada 30min
3. **Servidor 24/7**: Roda VISERON, APIs, dashboard, IA
4. **Acesso remoto**: `http://localhost:32123` via túnel SSH
5. **Backup**: Automático via sync bridge

---

## Deploy Automático (CI/CD)

Para deploy automático a cada commit:
```powershell
# No PC Principal, adicionar ao .git/hooks/post-commit:
# powershell -File server\sync-bridge.ps1 -SyncNow
```

Ou usar GitHub Actions para deploy direto no servidor.
