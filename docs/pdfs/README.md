# TVS Documentos PDF

Organizacao centralizada de todos os PDFs do sistema.

## Estrutura

```
docs/pdfs/
├── manuals/           # Manuais do sistema
│   ├── manual-viseron.pdf
│   └── manual-comandos-viseron.pdf
├── reports/           # Relatorios e relatorios de ciclo
│   ├── TVS_VISERON_MASTER_REPORT.pdf
│   ├── plano-100k-semana.pdf
│   ├── evolution_log.json
│   ├── cycle_1.json
│   ├── cycle_2.json
│   └── cycle_4.json
└── pitches/           # Pitches e apresentacoes
    └── Viseron_Startup_Pitch_v5.pdf
```

## Origem dos arquivos

Os PDFs sao copiados de suas localizacoes originais:
- `data/reports/` -> `docs/pdfs/manuals/` e `docs/pdfs/reports/`
- `data/` -> `docs/pdfs/pitches/`
- Raiz do projeto -> `docs/pdfs/reports/`

## Mantendo sincronizado

Execute o script de organizacao:
```bash
node scripts/sync-pdfs.js
```
