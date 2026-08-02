# CUDACyclone — Integração Viseron

Código-fonte vendido do projeto upstream **Dookoo2/CUDACyclone**
(commit `61fd323`, https://github.com/Dookoo2/CUDACyclone.git).

## Atribuição (licença GPL)

Este código é derivado de:
- **JeanLucPons/VanitySearch** (Jean-Luc Pons) — matemática secp256k1
- **FixedPaul/VanitySearch-Bitcrack** — otimizações CUDA

A licença GPL obriga a preservar os créditos e a licença originais. A autoria
do algoritmo e do kernel CUDA pertence aos autores acima; a integração no
Trinnity Viseron System (wrapper, comandos npm, documentação) é do TVS.

## Como é integrado

O Viseron não modifica nem reivindica o kernel CUDA como seu. O TVS fornece um
*launcher* nativo (`npm run cudacyclone`) que compila e executa este binário
numa máquina com NVIDIA GPU + CUDA toolkit (Linux/WSL2).

## Requisitos para executar

- GPU NVIDIA com CUDA (compute 7.5+)
- CUDA toolkit + `gcc` + `make` (Linux ou WSL2)
- Uma máquina Windows pura (sem GPU/CUDA) **não** consegue compilar nem correr

## Uso legítimo

Este ferramenta destina-se à **recuperação de chaves privadas próprias**
(por exemplo, endereços dos "Satoshi puzzles" públicos ou chaves perdidas com
intervalo conhecido). Não deve ser usada em endereços de terceiros.
