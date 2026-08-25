import { createTheme } from "./pdf-theme";
import * as fs from "fs";
import * as path from "path";

// ═══════════════════════════════════════════════════════════════════
// GERA 3 PDFs (PT / ES / EN) com o tema futurista (pdf-theme).
// Cover + tipografia viva + fluxo de texto seguro (sem sobreposições).
// ═══════════════════════════════════════════════════════════════════

type Lang = "pt" | "es" | "en";

const LANG_META: Record<Lang, { file: string; label: string; pageWord: string; langCode: string }> = {
  pt: { file: "Viseron_Startup_Pitch_v5_PT.pdf", label: "Português", pageWord: "Página", langCode: "PT" },
  es: { file: "Viseron_Startup_Pitch_v5_ES.pdf", label: "Español", pageWord: "Página", langCode: "ES" },
  en: { file: "Viseron_Startup_Pitch_v5_EN.pdf", label: "English", pageWord: "Page", langCode: "EN" },
};

// ─── Traduções ───
const T: Record<Lang, any> = {
  pt: {
    conf: "DOCUMENTO DE STARTUP  ·  CONFIDENCIAL  ·  2026",
    subtitle: "Sistema Operacional Multi-Agente de Superinteligência",
    tagline: "Autonomia real · Evolução contínua · Multi-plataforma",
    featL: ["14/14 testes passando", "5,000+ agentes autônomos", "Memória persistente STM/LTM", "4 ciclos de evolução ativos"],
    featR: ["290+ provedores de IA", "Web · Mobile · Desktop · CLI", "n8n + Voz + WhatsApp", "Deploy multi-cloud pronto"],
    prep: "Preparado para: Apresentação de Startup  ·  Agosto 2026",
    foundersRole: "Fundadores & Arquitetos do Sistema",
    sec1: "SUMÁRIO EXECUTIVO",
    sec1_body1: "O Trinnity Viseron System (TVS) é um sistema operacional multi-agente de IA projetado para operar com autonomia real, evoluir continuamente e coordenar milhares de agentes especializados rumo a objetivos complexos. O TVS não é um chatbot nem um modelo único — é uma organização digital que se auto-organiza, planeja e executa.",
    sec1_body2: "Diferente das IAs do mercado que exigem prompts, monitoramento e manutenção humana, o TVS sobe sozinho, spawna seus próprios agentes, executa tarefas, gera relatórios, faz backup e nunca para — mesmo diante de erros, ele registra e segue.",
    metrics_sub: "Métricas-chave do sistema",
    m1: ["5,000+", "Agentes autônomos"],
    m2: ["14/14", "Testes de núcleo verdes"],
    m3: ["290+", "Provedores de IA"],
    m4: ["4", "Ciclos de evolução"],
    m5: ["958", "Skills indexadas"],
    m6: ["6", "Plataformas de entrega"],
    m7: ["3", "Idiomas (PT/EN/ES)"],
    m8: ["100%", "Autonomia de execução"],
    sec2: "O PROBLEMA",
    sec2_intro: "As IAs atuais geram conversas, mas não resultados. As empresas que tentam automatizar com agentes enfrentam barreiras estruturais que consomem tempo e dinheiro.",
    sec2_sub1: "Limitações das soluções atuais",
    card_chat: "Chatbots & LLMs",
    card_chat_items: ["Respondem apenas quando perguntados", "Precisam de prompts e tuning humano", "Não evoluem sozinhos", "Esquecem tudo a cada sessão"],
    card_fw: "Frameworks de agentes",
    card_fw_items: ["Agentes morrem a cada execução", "Nenhuma memória persistente", "Orquestração manual obrigatória", "Crash significa trabalho perdido"],
    sec2_sub2: "O custo da supervisão humana",
    sec2_body: "60–80% do orçamento de projetos de agentes de IA é consumido por monitoramento, correção e re-execução. As empresas compram 'IA' mas continuam pagando operadores para operar a IA. O TVS elimina esse custo: os agentes se monitoram, se corrigem e evoluem sozinhos.",
    sec3: "A SOLUÇÃO",
    sec3_body: "O TVS é um sistema operacional de IA que executa trabalho real sem intervenção humana. Desde o primeiro boot, ele sobe servidores, carrega milhares de agentes, conecta integrações e arma ciclos de evolução que rodam para sempre.",
    sec3_sub1: "Arquitetura em camadas",
    th_layer: "Camada",
    th_comp: "Componentes",
    row_layer1: ["Apresentação", "WebOS (desktop no navegador), REST API, Socket.IO, relatórios PDF, App Mobile, Electron"],
    row_layer2: ["Integrações", "n8n, OmniRoute (290+ provedores), OpenJarvis, Call System (Twilio), ASNO (WhatsApp / Home Assistant)"],
    row_layer3: ["Superinteligência", "Síntese ensemble multi-provedor, HyperLearning, AutoEvolution"],
    row_layer4: ["Core Engine", "5,000+ agentes, squads, memória STM/LTM, tools, command chain, tokenomics"],
    sec3_sub2: "Diferenciais competitivos",
    diff1: "Autonomia real: o AutoPilot gera tarefas e as executa sozinho — até 2 por ciclo",
    diff2: "Memória viva: consolidação STM→LTM automática a cada 30 minutos",
    diff3: "Evolução contínua: inteligência multiplicada a cada ciclo de aprendizado",
    diff4: "Imortalidade: nenhum erro derruba o processo — loga e segue",
    diff5: "Watchdogs: cada integração reinicia sozinha se o processo morrer",
    sec4: "PRODUTO — O QUE JÁ FUNCIONA",
    sec4_body: "Ao contrário de muitos pitch decks, o TVS não é um protótipo: é um sistema executável, com testes automatizados, build reproduzível e múltiplos artefatos de distribuição prontos.",
    sec4_sub1: "Verificação técnica (agosto 2026)",
    th_cmd: "Comando",
    th_delivers: "O que entrega hoje",
    row_cmd1: ["npm test", "14/14 testes de núcleo passando"],
    row_cmd2: ["npm run lint", "TypeScript compila sem erros"],
    row_cmd3: ["npm start", "Sobe Dashboard + ReportServer + n8n + OmniRoute automaticamente"],
    row_cmd4: ["npm run build:android", "Gera APK para Android (Expo/EAS)"],
    row_cmd5: ["npm run build:exe", "Executável standalone Windows (não precisa de Node.js)"],
    row_cmd6: ["npm run build:electron", "App desktop (Portable + Installer)"],
    sec4_sub2: "Funcionalidades comprovadas",
    card_auto: "Autonomia & IA",
    card_auto_items: ["4 ciclos autônomos ativos", "SuperMind + SuperIntelligence multi-provedor", "Model Router: local (Ollama) + cloud", "Memória STM/LTM persistente em disco"],
    card_int: "Integrações & Interfaces",
    card_int_items: ["OmniRoute Hub — 290+ provedores de IA", "n8n Bridge — 5 templates de workflow", "Call System — voz por IA (Twilio)", "WebOS, REST API, PDF, Mobile, Terminal"],
    sec5: "AUTONOMIA & EVOLUÇÃO",
    sec5_sub1: "Os 4 ciclos autônomos — o coração do sistema",
    th_cycle: "Ciclo",
    th_freq: "Frequência",
    th_alone: "O que faz sozinho",
    row_cyc1: ["HyperLearning", "30 min", "Multiplica a inteligência; consulta IA, sintetiza insights e escreve relatórios"],
    row_cyc2: ["AutoEvolution", "60 min", "Agentes ganham conhecimento e novas capacidades; cruzamento gera híbridos"],
    row_cyc3: ["AutoLearning", "30 min", "Consolida memória de curto para longo prazo e mede conhecimento real"],
    row_cyc4: ["AutoPilot", "30 min", "Escaneia o sistema, gera tarefas e as executa — melhora a si mesmo"],
    sec5_sub2: "Exemplo real de autonomia",
    sec5_body: "O AutoPilot escaneia o sistema e encontra agentes inativos. Ele cria a tarefa 'Reativar agentes inativos', gera uma estratégia e a executa pelo orquestrador multi-agente. Nenhum humano precisa pedir. Conforme a autonomia cresce, ele cria agentes especializados, explora novas integrações e faz otimização profunda.",
    sec5_sub3: "Crescimento de inteligência",
    th_cycle2: "Ciclo",
    th_intel: "Inteligência relativa",
    th_obs: "Observação",
    row_int1: ["0", "100 (base)", "Boot do sistema"],
    row_int2: ["12", "~179", "×1.79 em 6 horas"],
    row_int3: ["48", "~1,000", "×10 em 24 horas"],
    row_int4: ["144", "~10,000", "×100 em 72 horas"],
    sec6: "INTEGRAÇÕES & ECOSSISTEMA",
    sec6_body: "Cada integração sobe sozinha no boot e é vigiada por watchdog: se o processo morrer, o TVS o reinicia. Nenhum humano precisa gerenciar.",
    sec6_sub1: "Módulos de integração",
    th_mod: "Módulo",
    th_fn: "Função",
    th_mgmt: "Auto-gestão",
    row_mod1: ["OmniRoute", "Gateway com 290+ provedores de IA", "Porta 20128 · auto-start · restart on exit"],
    row_mod2: ["OpenJarvis", "IA pessoal local estilo Stanford", "Auto-start · restart on exit"],
    row_mod3: ["n8n", "Engine de automação de workflows", "Porta 5678 · 5 templates · fallback local"],
    row_mod4: ["Call System", "Chamadas de voz por IA (Twilio)", "Agentes de voz + rastreio de chamadas"],
    row_mod5: ["ASNO", "Assistente WhatsApp + Home Assistant", "Webhooks + JARVIS WhatsApp"],
    row_mod6: ["Viseron Apps", "Engine de integrações de apps", "Stats de integrações e agentes"],
    row_mod7: ["ReportServer", "PDF + relatórios executivos", "Porta 3001 · /report/pdf"],
    sec6_sub2: "Servidores que sobem sozinhos",
    th_srv: "Servidor",
    th_port: "Porta",
    row_srv1: ["Dashboard WebOS", "3000", "Desktop OS no navegador + Socket.IO + REST API"],
    row_srv2: ["ReportServer PDF", "3001", "Relatórios executivos em PDF"],
    row_srv3: ["Standalone Web", "3000", "Modo web standalone com ContentAgent"],
    row_srv4: ["Forge Server", "4000", "Hospedagem git auto-gerenciada"],
    row_srv5: ["n8n", "5678", "Engine de workflows (spawnado pelo TVS)"],
    row_srv6: ["OmniRoute", "20128", "Gateway de 290+ provedores (spawnado)"],
    sec7: "MERCADO",
    sec7_body: "O mercado de agentes de IA autônomos está em crescimento explosivo. Empresas gastam bilhões em mão de obra de monitoramento de agentes — o TVS ataca exatamente esse custo, oferecendo um sistema que opera sozinho e se paga ao eliminar a supervisão manual.",
    sec7_sub1: "Segmentos-alvo",
    card_pme: "PMEs (SaaS)",
    card_pme_items: ["Automação de conteúdo, atendimento e processos", "Time-to-value em horas", "Preço: $29–$99/mês por instância", "Mercado grande e fragmentado"],
    card_ent: "Enterprise (Licença)",
    card_ent_items: ["Squads de agentes sob demanda", "Deploy on-premise com SLA 99.9%", "Preço: $499–$4,999/mês", "Ticket alto, ciclo mais longo"],
    sec7_sub2: "Por que agora",
    why1: "Ondas de agentes de IA — janela de vantagem de 12–24 meses",
    why2: "Sistema já funcional hoje, não é slide: testes verdes e artefatos distribuíveis",
    why3: "Custo de rodar IA caiu: modelos locais (Ollama) + cloud sob demanda",
    why4: "Stack completa com deploy multi-cloud já configurado",
    sec8: "MODELO DE NEGÓCIO",
    sec8_sub1: "Fontes de receita",
    card_saas: "Assinatura SaaS",
    card_saas_items: ["TVS Core $29/mês — até 100 agentes", "TVS Pro $99/mês — até 500 agentes", "TVS Enterprise $499/mês — ilimitado", "Planos anuais com desconto"],
    card_rev: "Receitas complementares",
    card_rev_items: ["Licenciamento on-premise enterprise", "Marketplace de skills/agentes (comissão 20%)", "Consultoria e implantação gerenciada", "Tokens $TRIN/$VSR como moeda de uso"],
    sec8_sub2: "Mecânica de valor",
    sec8_body: "Cada cliente ganha um sistema que opera 24/7: conteúdo publicado, workflows executados, atendimento processado, código gerado. O custo marginal por agente é baixo (modelos locais + roteamento inteligente), o que garante margens brutas de 70–85% em SaaS.",
    sec8_sub3: "Projeção de receita (conservadora)",
    th_phase: "Fase",
    th_cust: "Clientes",
    th_mrev: "Receita mensal",
    th_arev: "Receita anual",
    th_drv: "Impulsionadores",
    row_rev1: ["Ano 1 (v6.0)", "150", "$9K MRR", "$108K ARR", "SaaS early-adopters"],
    row_rev2: ["Ano 2 (v6.1)", "1,200", "$72K MRR", "$864K ARR", "+ canais e parcerias"],
    row_rev3: ["Ano 3 (v7.0)", "4,000", "$240K MRR", "$2.9M ARR", "+ Enterprise & marketplace"],
    sec9: "CONCORRÊNCIA & DIFERENCIAIS",
    sec9_sub1: "Posicionamento",
    th_comp2: "Concorrente",
    th_does: "O que faz",
    th_lim: "Limitação",
    row_comp1: ["Chatbots (ChatGPT, Claude, Gemini)", "Conversas sob demanda", "Sem execução contínua; sem memória de longo prazo"],
    row_comp2: ["Frameworks (LangChain, AutoGen)", "Bibliotecas para devs", "Requer engenharia pesada; agentes morrem por execução"],
    row_comp3: ["Automação (n8n, Zapier, Make)", "Workflows visuais", "Sem IA autônoma; configuração manual"],
    row_comp4: ["Agentes (Claude Agent, Manus)", "Assistência pontual", "Sem hierarquia/memória; custo por chamada alto"],
    row_comp5: ["Trinnity Viseron (TVS)", "Sistema completo", "Memória + hierarquia + auto-recuperação + open-source"],
    sec9_sub2: "Vantagens defensáveis (moat)",
    moat1: "Open-source com arquitetura própria — independência de um único framework",
    moat2: "Custo operacional baixo: modelos locais + roteamento entre 290+ provedores",
    moat3: "Ecossistema: 958 skills, templates n8n, marketplace planejado",
    moat4: "Comunidade e tokens $TRIN/$VSR como moeda de governança",
    sec10: "ROADMAP",
    r501: "v7.0 (atual) — Autonomia provada",
    r501_1: "5,000+ agentes autônomos + 4 ciclos de evolução ativos",
    r501_2: "AutoPilot executa tarefas sozinho; autonomia até 100%",
    r501_3: "Standalone .exe funcionando (não precisa de Node.js)",
    r501_4: "WebOS, voz PT/EN/ES, n8n, tokens, mobile",
    r511: "v5.1 — Expansão de autonomia",
    r511_1: "Auth multi-tenant e billing (Stripe)",
    r511_2: "Editor visual de workflows no WebOS",
    r511_3: "Drag-and-drop squad builder",
    r511_4: "Mais idiomas: FR, DE, IT, JP, ZH",
    r601: "v6.0 — Rede descentralizada",
    r601_1: "Rede p2p de agentes (multi-node cluster)",
    r601_2: "Blockchain para os tokens",
    r601_3: "Plugin marketplace de terceiros",
    r601_4: "Editor visual de comportamento de agentes",
    sec11: "PEDIDO DE INVESTIMENTO",
    sec11_body: "O TVS v7.0 já funciona de ponta a ponta: roda sozinho, evolui sozinho e se recupera sozinho. Buscamos investidores para escalar: cloud multi-nó, rede p2p, marketplace e crescimento comercial.",
    sec11_sub1: "Uso dos fundos",
    th_alloc: "Alocação",
    th_dest: "Destino",
    row_f1: ["50%", "Infraestrutura cloud + cluster multi-nó"],
    row_f2: ["25%", "Produto: marketplace, editor visual, app nativo"],
    row_f3: ["15%", "Marketing e canais enterprise"],
    row_f4: ["10%", "Operação, suporte e conformidade"],
    sec11_sub2: "Oportunidade",
    opp1: "Sistema funcional hoje — não é protótipo nem slide deck",
    opp2: "Autonomia comprovada: 5,000+ agentes, evolução contínua, auto-recuperação",
    opp3: "Stack completa (WebOS, voz, n8n, tokens, exe standalone, mobile)",
    opp4: "Primeiro-mover em 'IA que trabalha sozinha' — sem concorrência direta no nicho",
    sec12: "CONTATO",
    ct_line1: "VAMOS",
    ct_line2: "CONSTRUIR O FUTURO",
    ct_name: "Trinnity Viseron System v7.0",
    ct_sub: "Multi-Agent AI Superintelligence",
    ct_pedro: "👑 Pedro Costa — Supreme Commander",
    ct_trinnity: "👸 Trinnity Hurtado — Queen & Chief Architect",
    ct_contact: "Contato: pedro@trinnity.com · trinnity@viseron.io",
    ct_gh: "GitHub: github.com/ViseronSystem/trinnity-viseron-system",
    ct_dash: "Dashboard: http://localhost:3000",
    ct_cr: "© 2026 Trinnity Viseron System — Todos os direitos reservados",
  },

  es: {
    conf: "DOCUMENTO DE STARTUP  ·  CONFIDENCIAL  ·  2026",
    subtitle: "Sistema Operativo Multi-Agente de Superinteligencia",
    tagline: "Autonomía real · Evolución continua · Multiplataforma",
    featL: ["14/14 pruebas pasando", "5,000+ agentes autónomos", "Memoria persistente STM/LTM", "4 ciclos de evolución activos"],
    featR: ["290+ proveedores de IA", "Web · Móvil · Escritorio · CLI", "n8n + Voz + WhatsApp", "Deploy multinube listo"],
    prep: "Preparado para: Presentación de Startup  ·  Agosto 2026",
    foundersRole: "Fundadores y Arquitectos del Sistema",
    sec1: "RESUMEN EJECUTIVO",
    sec1_body1: "El Trinnity Viseron System (TVS) es un sistema operativo multi-agente de IA diseñado para operar con autonomía real, evolucionar continuamente y coordinar miles de agentes especializados hacia objetivos complejos. El TVS no es un chatbot ni un modelo único: es una organización digital que se auto-organiza, planifica y ejecuta.",
    sec1_body2: "A diferencia de las IA del mercado que exigen prompts, monitoreo y mantenimiento humano, el TVS arranca solo, genera sus propios agentes, ejecuta tareas, crea informes, hace backup y nunca se detiene — incluso ante errores, los registra y continúa.",
    metrics_sub: "Métricas clave del sistema",
    m1: ["5,000+", "Agentes autónomos"],
    m2: ["14/14", "Pruebas de núcleo verdes"],
    m3: ["290+", "Proveedores de IA"],
    m4: ["4", "Ciclos de evolución"],
    m5: ["958", "Skills indexadas"],
    m6: ["6", "Plataformas de entrega"],
    m7: ["3", "Idiomas (PT/EN/ES)"],
    m8: ["100%", "Autonomía de ejecución"],
    sec2: "EL PROBLEMA",
    sec2_intro: "Las IA actuales generan conversaciones, pero no resultados. Las empresas que intentan automatizar con agentes enfrentan barreras estructurales que consumen tiempo y dinero.",
    sec2_sub1: "Limitaciones de las soluciones actuales",
    card_chat: "Chatbots & LLMs",
    card_chat_items: ["Responden solo cuando se les pregunta", "Necesitan prompts y ajuste humano", "No evolucionan solos", "Olvidan todo en cada sesión"],
    card_fw: "Frameworks de agentes",
    card_fw_items: ["Los agentes mueren en cada ejecución", "Sin memoria persistente", "Orquestación manual obligatoria", "Un crash significa trabajo perdido"],
    sec2_sub2: "El costo de la supervisión humana",
    sec2_body: "60–80% del presupuesto de proyectos de agentes de IA se consume en monitoreo, corrección y re-ejecución. Las empresas compran 'IA' pero siguen pagando operadores para operar la IA. El TVS elimina ese costo: los agentes se monitorean, se corrigen y evolucionan solos.",
    sec3: "LA SOLUCIÓN",
    sec3_body: "El TVS es un sistema operativo de IA que ejecuta trabajo real sin intervención humana. Desde el primer arranque, levanta servidores, carga miles de agentes, conecta integraciones y arma ciclos de evolución que funcionan para siempre.",
    sec3_sub1: "Arquitectura en capas",
    th_layer: "Capa",
    th_comp: "Componentes",
    row_layer1: ["Presentación", "WebOS (escritorio en navegador), REST API, Socket.IO, informes PDF, App Móvil, Electron"],
    row_layer2: ["Integraciones", "n8n, OmniRoute (290+ proveedores), OpenJarvis, Call System (Twilio), ASNO (WhatsApp / Home Assistant)"],
    row_layer3: ["Superinteligencia", "Síntesis ensemble multi-proveedor, HyperLearning, AutoEvolution"],
    row_layer4: ["Core Engine", "5,000+ agentes, squads, memoria STM/LTM, tools, command chain, tokenomics"],
    sec3_sub2: "Diferenciales competitivos",
    diff1: "Autonomía real: el AutoPilot genera tareas y las ejecuta solo — hasta 2 por ciclo",
    diff2: "Memoria viva: consolidación STM→LTM automática cada 30 minutos",
    diff3: "Evolución continua: inteligencia multiplicada en cada ciclo de aprendizaje",
    diff4: "Inmortalidad: ningún error detiene el proceso — registra y continúa",
    diff5: "Watchdogs: cada integración se reinicia sola si el proceso muere",
    sec4: "PRODUCTO — LO QUE YA FUNCIONA",
    sec4_body: "A diferencia de muchos pitch decks, el TVS no es un prototipo: es un sistema ejecutable, con pruebas automatizadas, build reproducible y múltiples artefactos de distribución listos.",
    sec4_sub1: "Verificación técnica (agosto 2026)",
    th_cmd: "Comando",
    th_delivers: "Lo que entrega hoy",
    row_cmd1: ["npm test", "14/14 pruebas de núcleo pasando"],
    row_cmd2: ["npm run lint", "TypeScript compila sin errores"],
    row_cmd3: ["npm start", "Levanta Dashboard + ReportServer + n8n + OmniRoute automáticamente"],
    row_cmd4: ["npm run build:android", "Genera APK para Android (Expo/EAS)"],
    row_cmd5: ["npm run build:exe", "Ejecutable standalone Windows (sin Node.js)"],
    row_cmd6: ["npm run build:electron", "App de escritorio (Portable + Installer)"],
    sec4_sub2: "Funcionalidades comprobadas",
    card_auto: "Autonomía & IA",
    card_auto_items: ["4 ciclos autónomos activos", "SuperMind + SuperIntelligence multi-proveedor", "Model Router: local (Ollama) + nube", "Memoria STM/LTM persistente en disco"],
    card_int: "Integraciones & Interfaces",
    card_int_items: ["OmniRoute Hub — 290+ proveedores de IA", "n8n Bridge — 5 plantillas de workflow", "Call System — voz por IA (Twilio)", "WebOS, REST API, PDF, Móvil, Terminal"],
    sec5: "AUTONOMÍA & EVOLUCIÓN",
    sec5_sub1: "Los 4 ciclos autónomos — el corazón del sistema",
    th_cycle: "Ciclo",
    th_freq: "Frecuencia",
    th_alone: "Qué hace solo",
    row_cyc1: ["HyperLearning", "30 min", "Multiplica la inteligencia; consulta IA, sintetiza ideas y escribe informes"],
    row_cyc2: ["AutoEvolution", "60 min", "Los agentes ganan conocimiento y nuevas capacidades; el cruce genera híbridos"],
    row_cyc3: ["AutoLearning", "30 min", "Consolida memoria de corto a largo plazo y mide el conocimiento real"],
    row_cyc4: ["AutoPilot", "30 min", "Escanea el sistema, genera tareas y las ejecuta — mejora a sí mismo"],
    sec5_sub2: "Ejemplo real de autonomía",
    sec5_body: "El AutoPilot escanea el sistema y encuentra agentes inactivos. Crea la tarea 'Reactivar agentes inactivos', genera una estrategia y la ejecuta mediante el orquestador multi-agente. Ningún humano tiene que pedirlo. A medida que crece la autonomía, crea agentes especializados, explora nuevas integraciones y hace optimización profunda.",
    sec5_sub3: "Crecimiento de la inteligencia",
    th_cycle2: "Ciclo",
    th_intel: "Inteligencia relativa",
    th_obs: "Observación",
    row_int1: ["0", "100 (base)", "Arranque del sistema"],
    row_int2: ["12", "~179", "×1.79 en 6 horas"],
    row_int3: ["48", "~1,000", "×10 en 24 horas"],
    row_int4: ["144", "~10,000", "×100 en 72 horas"],
    sec6: "INTEGRACIONES & ECOSISTEMA",
    sec6_body: "Cada integración arranca sola y es vigilada por un watchdog: si el proceso muere, el TVS lo reinicia. Ningún humano necesita gestionarlo.",
    sec6_sub1: "Módulos de integración",
    th_mod: "Módulo",
    th_fn: "Función",
    th_mgmt: "Autogestión",
    row_mod1: ["OmniRoute", "Gateway con 290+ proveedores de IA", "Puerto 20128 · auto-start · restart on exit"],
    row_mod2: ["OpenJarvis", "IA personal local estilo Stanford", "Auto-start · restart on exit"],
    row_mod3: ["n8n", "Engine de automatización de workflows", "Puerto 5678 · 5 plantillas · fallback local"],
    row_mod4: ["Call System", "Llamadas de voz por IA (Twilio)", "Agentes de voz + seguimiento de llamadas"],
    row_mod5: ["ASNO", "Asistente WhatsApp + Home Assistant", "Webhooks + JARVIS WhatsApp"],
    row_mod6: ["Viseron Apps", "Engine de integraciones de apps", "Stats de integraciones y agentes"],
    row_mod7: ["ReportServer", "PDF + informes ejecutivos", "Puerto 3001 · /report/pdf"],
    sec6_sub2: "Servidores que arrancan solos",
    th_srv: "Servidor",
    th_port: "Puerto",
    row_srv1: ["Dashboard WebOS", "3000", "Desktop OS en navegador + Socket.IO + REST API"],
    row_srv2: ["ReportServer PDF", "3001", "Informes ejecutivos en PDF"],
    row_srv3: ["Standalone Web", "3000", "Modo web standalone con ContentAgent"],
    row_srv4: ["Forge Server", "4000", "Hospedaje git auto-gestionado"],
    row_srv5: ["n8n", "5678", "Engine de workflows (spawn por TVS)"],
    row_srv6: ["OmniRoute", "20128", "Gateway de 290+ proveedores (spawn)"],
    sec7: "MERCADO",
    sec7_body: "El mercado de agentes de IA autónomos está en crecimiento explosivo. Las empresas gastan miles de millones en mano de obra de monitoreo de agentes — el TVS ataca exactamente ese costo, ofreciendo un sistema que opera solo y se paga al eliminar la supervisión manual.",
    sec7_sub1: "Segmentos objetivo",
    card_pme: "PYMEs (SaaS)",
    card_pme_items: ["Automatización de contenido, atención y procesos", "Time-to-value en horas", "Precio: $29–$99/mes por instancia", "Mercado grande y fragmentado"],
    card_ent: "Enterprise (Licencia)",
    card_ent_items: ["Squads de agentes bajo demanda", "Deploy on-premise con SLA 99.9%", "Precio: $499–$4,999/mes", "Ticket alto, ciclo más largo"],
    sec7_sub2: "Por qué ahora",
    why1: "Olas de agentes de IA — ventana de ventaja de 12–24 meses",
    why2: "Sistema ya funcional hoy, no es un slide: pruebas verdes y artefactos distribuibles",
    why3: "El costo de ejecutar IA bajó: modelos locales (Ollama) + nube bajo demanda",
    why4: "Stack completo con deploy multinube ya configurado",
    sec8: "MODELO DE NEGOCIO",
    sec8_sub1: "Fuentes de ingresos",
    card_saas: "Suscripción SaaS",
    card_saas_items: ["TVS Core $29/mes — hasta 100 agentes", "TVS Pro $99/mes — hasta 500 agentes", "TVS Enterprise $499/mes — ilimitado", "Planes anuales con descuento"],
    card_rev: "Ingresos complementarios",
    card_rev_items: ["Licenciamiento on-premise enterprise", "Marketplace de skills/agentes (comisión 20%)", "Consultoría e implantación gestionada", "Tokens $TRIN/$VSR como moneda de uso"],
    sec8_sub2: "Mecánica de valor",
    sec8_body: "Cada cliente obtiene un sistema que opera 24/7: contenido publicado, workflows ejecutados, atención procesada, código generado. El costo marginal por agente es bajo (modelos locales + enrutamiento inteligente), lo que garantiza márgenes brutos de 70–85% en SaaS.",
    sec8_sub3: "Proyección de ingresos (conservadora)",
    th_phase: "Fase",
    th_cust: "Clientes",
    th_mrev: "Ingresos mensuales",
    th_arev: "Ingresos anuales",
    th_drv: "Impulsores",
    row_rev1: ["Año 1 (v6.0)", "150", "$9K MRR", "$108K ARR", "SaaS early-adopters"],
    row_rev2: ["Año 2 (v6.1)", "1,200", "$72K MRR", "$864K ARR", "+ canales y alianzas"],
    row_rev3: ["Año 3 (v7.0)", "4,000", "$240K MRR", "$2.9M ARR", "+ Enterprise & marketplace"],
    sec9: "COMPETENCIA & DIFERENCIALES",
    sec9_sub1: "Posicionamiento",
    th_comp2: "Competidor",
    th_does: "Qué hace",
    th_lim: "Limitación",
    row_comp1: ["Chatbots (ChatGPT, Claude, Gemini)", "Conversaciones bajo demanda", "Sin ejecución continua; sin memoria de largo plazo"],
    row_comp2: ["Frameworks (LangChain, AutoGen)", "Bibliotecas para devs", "Requiere ingeniería pesada; agentes mueren por ejecución"],
    row_comp3: ["Automatización (n8n, Zapier, Make)", "Workflows visuales", "Sin IA autónoma; configuración manual"],
    row_comp4: ["Agentes (Claude Agent, Manus)", "Asistencia puntual", "Sin jerarquía/memoria; costo por llamada alto"],
    row_comp5: ["Trinnity Viseron (TVS)", "Sistema completo", "Memoria + jerarquía + auto-recuperación + open-source"],
    sec9_sub2: "Ventajas defendibles (moat)",
    moat1: "Open-source con arquitectura propia — independencia de un solo framework",
    moat2: "Costo operativo bajo: modelos locales + enrutamiento entre 290+ proveedores",
    moat3: "Ecosistema: 958 skills, plantillas n8n, marketplace planificado",
    moat4: "Comunidad y tokens $TRIN/$VSR como moneda de gobernanza",
    sec10: "ROADMAP",
    r501: "v7.0 (actual) — Autonomía comprobada",
    r501_1: "5,000+ agentes autónomos + 4 ciclos de evolución activos",
    r501_2: "AutoPilot ejecuta tareas solo; autonomía hasta 100%",
    r501_3: "Standalone .exe funcionando (sin Node.js)",
    r501_4: "WebOS, voz PT/EN/ES, n8n, tokens, móvil",
    r511: "v5.1 — Expansión de autonomía",
    r511_1: "Auth multi-tenant y billing (Stripe)",
    r511_2: "Editor visual de workflows en WebOS",
    r511_3: "Drag-and-drop squad builder",
    r511_4: "Más idiomas: FR, DE, IT, JP, ZH",
    r601: "v6.0 — Red descentralizada",
    r601_1: "Red p2p de agentes (cluster multi-nodo)",
    r601_2: "Blockchain para los tokens",
    r601_3: "Plugin marketplace de terceros",
    r601_4: "Editor visual de comportamiento de agentes",
    sec11: "SOLICITUD DE INVERSIÓN",
    sec11_body: "El TVS v7.0 ya funciona de punta a punta: arranca solo, evoluciona solo y se recupera solo. Buscamos inversores para escalar: nube multi-nodo, red p2p, marketplace y crecimiento comercial.",
    sec11_sub1: "Uso de los fondos",
    th_alloc: "Asignación",
    th_dest: "Destino",
    row_f1: ["50%", "Infraestructura cloud + cluster multi-nodo"],
    row_f2: ["25%", "Producto: marketplace, editor visual, app nativa"],
    row_f3: ["15%", "Marketing y canales enterprise"],
    row_f4: ["10%", "Operación, soporte y conformidad"],
    sec11_sub2: "Oportunidad",
    opp1: "Sistema funcional hoy — no es prototipo ni slide deck",
    opp2: "Autonomía comprobada: 5,000+ agentes, evolución continua, auto-recuperación",
    opp3: "Stack completo (WebOS, voz, n8n, tokens, exe standalone, móvil)",
    opp4: "Primer-movilizador en 'IA que trabaja sola' — sin competencia directa en el nicho",
    sec12: "CONTACTO",
    ct_line1: "VAMOS",
    ct_line2: "CONSTRUIR EL FUTURO",
    ct_name: "Trinnity Viseron System v7.0",
    ct_sub: "Multi-Agent AI Superintelligence",
    ct_pedro: "👑 Pedro Costa — Supreme Commander",
    ct_trinnity: "👸 Trinnity Hurtado — Queen & Chief Architect",
    ct_contact: "Contacto: pedro@trinnity.com · trinnity@viseron.io",
    ct_gh: "GitHub: github.com/ViseronSystem/trinnity-viseron-system",
    ct_dash: "Dashboard: http://localhost:3000",
    ct_cr: "© 2026 Trinnity Viseron System — Todos los derechos reservados",
  },

  en: {
    conf: "STARTUP DOCUMENT  ·  CONFIDENTIAL  ·  2026",
    subtitle: "Multi-Agent AI Operating System",
    tagline: "Real autonomy · Continuous evolution · Multi-platform",
    featL: ["14/14 tests passing", "5,000+ autonomous agents", "Persistent STM/LTM memory", "4 active evolution cycles"],
    featR: ["290+ AI providers", "Web · Mobile · Desktop · CLI", "n8n + Voice + WhatsApp", "Multi-cloud deploy ready"],
    prep: "Prepared for: Startup Presentation  ·  August 2026",
    foundersRole: "Founders & System Architects",
    sec1: "EXECUTIVE SUMMARY",
    sec1_body1: "Trinnity Viseron System (TVS) is a multi-agent AI operating system designed to operate with real autonomy, evolve continuously, and coordinate thousands of specialized agents toward complex goals. TVS is not a chatbot or a single model — it is a self-organizing digital organization that plans and executes.",
    sec1_body2: "Unlike market AIs that require prompts, monitoring, and human maintenance, TVS boots by itself, spawns its own agents, executes tasks, generates reports, runs backups, and never stops — even when errors occur, it logs them and keeps going.",
    metrics_sub: "Key system metrics",
    m1: ["5,000+", "Autonomous agents"],
    m2: ["14/14", "Core tests green"],
    m3: ["290+", "AI providers"],
    m4: ["4", "Evolution cycles"],
    m5: ["958", "Indexed skills"],
    m6: ["6", "Delivery platforms"],
    m7: ["3", "Languages (PT/EN/ES)"],
    m8: ["100%", "Execution autonomy"],
    sec2: "THE PROBLEM",
    sec2_intro: "Today's AIs produce conversations, not results. Companies trying to automate with agents face structural barriers that consume time and money.",
    sec2_sub1: "Limitations of current solutions",
    card_chat: "Chatbots & LLMs",
    card_chat_items: ["Only respond when asked", "Need human prompts and tuning", "Do not evolve on their own", "Forget everything each session"],
    card_fw: "Agent frameworks",
    card_fw_items: ["Agents die on every execution", "No persistent memory", "Manual orchestration required", "A crash means lost work"],
    sec2_sub2: "The cost of human oversight",
    sec2_body: "60–80% of the budget for AI agent projects is spent on monitoring, fixing, and re-running. Companies buy 'AI' but still pay operators to operate the AI. TVS removes that cost: agents monitor, fix, and evolve themselves.",
    sec3: "THE SOLUTION",
    sec3_body: "TVS is an AI operating system that executes real work without human intervention. From first boot, it starts servers, loads thousands of agents, connects integrations, and arms evolution cycles that run forever.",
    sec3_sub1: "Layered architecture",
    th_layer: "Layer",
    th_comp: "Components",
    row_layer1: ["Presentation", "WebOS (browser desktop), REST API, Socket.IO, PDF reports, Mobile App, Electron"],
    row_layer2: ["Integrations", "n8n, OmniRoute (290+ providers), OpenJarvis, Call System (Twilio), ASNO (WhatsApp / Home Assistant)"],
    row_layer3: ["Superintelligence", "Multi-provider ensemble synthesis, HyperLearning, AutoEvolution"],
    row_layer4: ["Core Engine", "5,000+ agents, squads, STM/LTM memory, tools, command chain, tokenomics"],
    sec3_sub2: "Competitive advantages",
    diff1: "Real autonomy: AutoPilot generates tasks and executes them alone — up to 2 per cycle",
    diff2: "Living memory: automatic STM→LTM consolidation every 30 minutes",
    diff3: "Continuous evolution: intelligence multiplied each learning cycle",
    diff4: "Immortality: no error takes down the process — log and continue",
    diff5: "Watchdogs: every integration restarts itself if the process dies",
    sec4: "PRODUCT — WHAT ALREADY WORKS",
    sec4_body: "Unlike many pitch decks, TVS is not a prototype: it is an executable system with automated tests, a reproducible build, and multiple ready distribution artifacts.",
    sec4_sub1: "Technical verification (August 2026)",
    th_cmd: "Command",
    th_delivers: "What it delivers today",
    row_cmd1: ["npm test", "14/14 core tests passing"],
    row_cmd2: ["npm run lint", "TypeScript compiles with no errors"],
    row_cmd3: ["npm start", "Boots Dashboard + ReportServer + n8n + OmniRoute automatically"],
    row_cmd4: ["npm run build:android", "Builds APK for Android (Expo/EAS)"],
    row_cmd5: ["npm run build:exe", "Standalone Windows executable (no Node.js needed)"],
    row_cmd6: ["npm run build:electron", "Desktop app (Portable + Installer)"],
    sec4_sub2: "Proven features",
    card_auto: "Autonomy & AI",
    card_auto_items: ["4 active autonomous cycles", "Multi-provider SuperMind + SuperIntelligence", "Model Router: local (Ollama) + cloud", "STM/LTM memory persisted to disk"],
    card_int: "Integrations & Interfaces",
    card_int_items: ["OmniRoute Hub — 290+ AI providers", "n8n Bridge — 5 workflow templates", "Call System — AI voice (Twilio)", "WebOS, REST API, PDF, Mobile, Terminal"],
    sec5: "AUTONOMY & EVOLUTION",
    sec5_sub1: "The 4 autonomous cycles — the heart of the system",
    th_cycle: "Cycle",
    th_freq: "Frequency",
    th_alone: "What it does alone",
    row_cyc1: ["HyperLearning", "30 min", "Multiplies intelligence; queries AI, synthesizes insights, writes reports"],
    row_cyc2: ["AutoEvolution", "60 min", "Agents gain knowledge and new capabilities; crossover creates hybrids"],
    row_cyc3: ["AutoLearning", "30 min", "Consolidates short-term into long-term memory and measures real knowledge"],
    row_cyc4: ["AutoPilot", "30 min", "Scans the system, generates tasks, and executes them — improves itself"],
    sec5_sub2: "Real autonomy example",
    sec5_body: "AutoPilot scans the system and finds inactive agents. It creates the task 'Reactivate inactive agents', generates a strategy, and executes it through the multi-agent orchestrator. No human has to ask. As autonomy grows, it creates specialized agents, explores new integrations, and does deep optimization.",
    sec5_sub3: "Intelligence growth",
    th_cycle2: "Cycle",
    th_intel: "Relative intelligence",
    th_obs: "Observation",
    row_int1: ["0", "100 (baseline)", "System boot"],
    row_int2: ["12", "~179", "×1.79 in 6 hours"],
    row_int3: ["48", "~1,000", "×10 in 24 hours"],
    row_int4: ["144", "~10,000", "×100 in 72 hours"],
    sec6: "INTEGRATIONS & ECOSYSTEM",
    sec6_body: "Each integration boots on its own and is watched by a watchdog: if the process dies, TVS restarts it. No human needs to manage it.",
    sec6_sub1: "Integration modules",
    th_mod: "Module",
    th_fn: "Function",
    th_mgmt: "Self-management",
    row_mod1: ["OmniRoute", "Gateway with 290+ AI providers", "Port 20128 · auto-start · restart on exit"],
    row_mod2: ["OpenJarvis", "Personal local AI (Stanford-style)", "Auto-start · restart on exit"],
    row_mod3: ["n8n", "Workflow automation engine", "Port 5678 · 5 templates · local fallback"],
    row_mod4: ["Call System", "AI voice calls (Twilio)", "Voice agents + call tracking"],
    row_mod5: ["ASNO", "WhatsApp + Home Assistant assistant", "Webhooks + JARVIS WhatsApp"],
    row_mod6: ["Viseron Apps", "App integrations engine", "Integration & agent stats"],
    row_mod7: ["ReportServer", "PDF + executive reports", "Port 3001 · /report/pdf"],
    sec6_sub2: "Servers that boot on their own",
    th_srv: "Server",
    th_port: "Port",
    row_srv1: ["Dashboard WebOS", "3000", "Browser desktop OS + Socket.IO + REST API"],
    row_srv2: ["ReportServer PDF", "3001", "Executive PDF reports"],
    row_srv3: ["Standalone Web", "3000", "Standalone web mode with ContentAgent"],
    row_srv4: ["Forge Server", "4000", "Self-managed git hosting"],
    row_srv5: ["n8n", "5678", "Workflow engine (spawned by TVS)"],
    row_srv6: ["OmniRoute", "20128", "Gateway for 290+ providers (spawned)"],
    sec7: "MARKET",
    sec7_body: "The autonomous AI agent market is growing explosively. Companies spend billions on agent monitoring labor — TVS attacks exactly that cost by offering a system that operates alone and pays for itself by eliminating manual oversight.",
    sec7_sub1: "Target segments",
    card_pme: "SMBs (SaaS)",
    card_pme_items: ["Content, support and process automation", "Hours to value, not weeks", "Price: $29–$99/month per instance", "Large and fragmented market"],
    card_ent: "Enterprise (License)",
    card_ent_items: ["On-demand agent squads", "On-premise deploy with 99.9% SLA", "Price: $499–$4,999/month", "High ticket, longer cycle"],
    sec7_sub2: "Why now",
    why1: "AI agent wave — 12–24 month advantage window",
    why2: "System already working today, not a slide: green tests and distributable artifacts",
    why3: "Cost of running AI dropped: local models (Ollama) + on-demand cloud",
    why4: "Full stack with multi-cloud deploy already configured",
    sec8: "BUSINESS MODEL",
    sec8_sub1: "Revenue streams",
    card_saas: "SaaS subscription",
    card_saas_items: ["TVS Core $29/month — up to 100 agents", "TVS Pro $99/month — up to 500 agents", "TVS Enterprise $499/month — unlimited", "Annual plans with discount"],
    card_rev: "Complementary revenue",
    card_rev_items: ["Enterprise on-premise licensing", "Skills/agents marketplace (20% commission)", "Managed consulting & deployment", "$TRIN/$VSR tokens as usage currency"],
    sec8_sub2: "Value mechanics",
    sec8_body: "Each customer gets a system that operates 24/7: content published, workflows executed, support processed, code generated. The marginal cost per agent is low (local models + smart routing), securing 70–85% gross margins in SaaS.",
    sec8_sub3: "Revenue projection (conservative)",
    th_phase: "Phase",
    th_cust: "Customers",
    th_mrev: "Monthly revenue",
    th_arev: "Annual revenue",
    th_drv: "Drivers",
    row_rev1: ["Year 1 (v6.0)", "150", "$9K MRR", "$108K ARR", "SaaS early adopters"],
    row_rev2: ["Year 2 (v6.1)", "1,200", "$72K MRR", "$864K ARR", "+ channels & partnerships"],
    row_rev3: ["Year 3 (v7.0)", "4,000", "$240K MRR", "$2.9M ARR", "+ Enterprise & marketplace"],
    sec9: "COMPETITION & DIFFERENTIATORS",
    sec9_sub1: "Positioning",
    th_comp2: "Competitor",
    th_does: "What it does",
    th_lim: "Limitation",
    row_comp1: ["Chatbots (ChatGPT, Claude, Gemini)", "On-demand conversations", "No continuous execution; no long-term memory"],
    row_comp2: ["Frameworks (LangChain, AutoGen)", "Developer libraries", "Requires heavy engineering; agents die per execution"],
    row_comp3: ["Automation (n8n, Zapier, Make)", "Visual workflows", "No autonomous AI; manual configuration"],
    row_comp4: ["Agents (Claude Agent, Manus)", "Point assistance", "No hierarchy/memory; high per-call cost"],
    row_comp5: ["Trinnity Viseron (TVS)", "Complete system", "Memory + hierarchy + self-healing + open-source"],
    sec9_sub2: "Defensible advantages (moat)",
    moat1: "Open-source with proprietary architecture — independent of any single framework",
    moat2: "Low operating cost: local models + routing across 290+ providers",
    moat3: "Ecosystem: 958 skills, n8n templates, planned marketplace",
    moat4: "Community and $TRIN/$VSR tokens as governance currency",
    sec10: "ROADMAP",
    r501: "v7.0 (current) — Proven autonomy",
    r501_1: "5,000+ autonomous agents + 4 active evolution cycles",
    r501_2: "AutoPilot executes tasks alone; autonomy up to 100%",
    r501_3: "Standalone .exe working (no Node.js needed)",
    r501_4: "WebOS, PT/EN/ES voice, n8n, tokens, mobile",
    r511: "v5.1 — Autonomy expansion",
    r511_1: "Multi-tenant auth and billing (Stripe)",
    r511_2: "Visual workflow editor in WebOS",
    r511_3: "Drag-and-drop squad builder",
    r511_4: "More languages: FR, DE, IT, JP, ZH",
    r601: "v6.0 — Decentralized network",
    r601_1: "P2P agent network (multi-node cluster)",
    r601_2: "Blockchain for tokens",
    r601_3: "Third-party plugin marketplace",
    r601_4: "Visual agent behavior editor",
    sec11: "INVESTMENT REQUEST",
    sec11_body: "TVS v7.0 already works end-to-end: it boots alone, evolves alone, and recovers alone. We are seeking investors to scale: multi-node cloud, p2p network, marketplace, and commercial growth.",
    sec11_sub1: "Use of funds",
    th_alloc: "Allocation",
    th_dest: "Destination",
    row_f1: ["50%", "Cloud infrastructure + multi-node cluster"],
    row_f2: ["25%", "Product: marketplace, visual editor, native app"],
    row_f3: ["15%", "Marketing and enterprise channels"],
    row_f4: ["10%", "Operations, support and compliance"],
    sec11_sub2: "Opportunity",
    opp1: "Working system today — not a prototype or slide deck",
    opp2: "Proven autonomy: 5,000+ agents, continuous evolution, self-healing",
    opp3: "Full stack (WebOS, voice, n8n, tokens, standalone exe, mobile)",
    opp4: "First-mover in 'AI that works alone' — no direct niche competition",
    sec12: "CONTACT",
    ct_line1: "LET'S",
    ct_line2: "BUILD THE FUTURE",
    ct_name: "Trinnity Viseron System v7.0",
    ct_sub: "Multi-Agent AI Superintelligence",
    ct_pedro: "👑 Pedro Costa — Supreme Commander",
    ct_trinnity: "👸 Trinnity Hurtado — Queen & Chief Architect",
    ct_contact: "Contact: pedro@trinnity.com · trinnity@viseron.io",
    ct_gh: "GitHub: github.com/ViseronSystem/trinnity-viseron-system",
    ct_dash: "Dashboard: http://localhost:3000",
    ct_cr: "© 2026 Trinnity Viseron System — All rights reserved",
  },
};

// ═══════════════════════════════════════════════════════════════════
// THEME ENGINE — helpers de conteúdo (fluxo de texto, sem overlap)
// ═══════════════════════════════════════════════════════════════════
function metricKVs(th: any, tr: any, keys: string[]) {
  keys.forEach((k) => th.kv(tr[k][0], tr[k][1]));
}

function cardGroup(th: any, title: string, items: string[], color?: string) {
  th.chip(title, color);
  th.bullets(items.map((it) => ({ icon: "▸", text: it })));
}

// ═══════════════════════════════════════════════════════════════════
// BUILD — um PDF por idioma
// ═══════════════════════════════════════════════════════════════════
function buildPDF(lang: Lang) {
  const meta = LANG_META[lang];
  const tr = T[lang];
  const OUTPUT = path.join(__dirname, "..", "data", meta.file);

  const th = createTheme({
    title: `Trinnity Viseron System v7.0 — Startup Pitch (${meta.label})`,
    subject: "Multi-Agent AI Superintelligence — Full System Overview",
  });

  // ─── COVER futurista (um por idioma, título com a língua) ───
  th.cover({
    title: `TRINNITY VISERON SYSTEM\nSTARTUP PITCH · ${meta.label.toUpperCase()}`,
    subtitle: `${tr.subtitle} — ${tr.tagline}`,
    badges: [...tr.featL, ...tr.featR],
    date: "06/08/2026",
    version: "5.0",
    url: "www.trinnityviseronsystem.io",
  });

  // ─── 1. SUMÁRIO EXECUTIVO ───
  th.section("1", tr.sec1);
  th.para(tr.sec1_body1);
  th.para(tr.sec1_body2);
  th.sub(tr.metrics_sub);
  metricKVs(th, tr, ["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8"]);

  // ─── 2. O PROBLEMA ───
  th.section("2", tr.sec2);
  th.para(tr.sec2_intro);
  th.sub(tr.sec2_sub1);
  cardGroup(th, tr.card_chat, tr.card_chat_items);
  cardGroup(th, tr.card_fw, tr.card_fw_items);
  th.sub(tr.sec2_sub2);
  th.para(tr.sec2_body);

  // ─── 3. A SOLUÇÃO ───
  th.section("3", tr.sec3);
  th.para(tr.sec3_body);
  th.sub(tr.sec3_sub1);
  [tr.row_layer1, tr.row_layer2, tr.row_layer3, tr.row_layer4].forEach((r) => th.kv(r[0], r[1]));
  th.sub(tr.sec3_sub2);
  th.bullets([tr.diff1, tr.diff2, tr.diff3, tr.diff4, tr.diff5].map((d) => ({ icon: "▸", text: d })));

  // ─── 4. PRODUTO — O QUE JÁ FUNCIONA ───
  th.section("4", tr.sec4);
  th.para(tr.sec4_body);
  th.sub(tr.sec4_sub1);
  [tr.row_cmd1, tr.row_cmd2, tr.row_cmd3, tr.row_cmd4, tr.row_cmd5, tr.row_cmd6]
    .forEach((r) => th.code(r[0], r[1]));
  th.sub(tr.sec4_sub2);
  cardGroup(th, tr.card_auto, tr.card_auto_items);
  cardGroup(th, tr.card_int, tr.card_int_items);

  // ─── 5. AUTONOMIA & EVOLUÇÃO ───
  th.section("5", tr.sec5);
  th.sub(tr.sec5_sub1);
  [tr.row_cyc1, tr.row_cyc2, tr.row_cyc3, tr.row_cyc4]
    .forEach((r) => th.bullet("▸", `${r[0]} (${r[1]}) — ${r[2]}`));
  th.sub(tr.sec5_sub2);
  th.para(tr.sec5_body);
  th.sub(tr.sec5_sub3);
  [tr.row_int1, tr.row_int2, tr.row_int3, tr.row_int4]
    .forEach((r) => th.bullet("▸", `${r[0]} · ${r[1]} — ${r[2]}`));

  // ─── 6. INTEGRAÇÕES & ECOSSISTEMA ───
  th.section("6", tr.sec6);
  th.para(tr.sec6_body);
  th.sub(tr.sec6_sub1);
  [tr.row_mod1, tr.row_mod2, tr.row_mod3, tr.row_mod4, tr.row_mod5, tr.row_mod6, tr.row_mod7]
    .forEach((r) => th.bullet("▸", `${r[0]} — ${r[1]} · ${r[2]}`));
  th.sub(tr.sec6_sub2);
  [tr.row_srv1, tr.row_srv2, tr.row_srv3, tr.row_srv4, tr.row_srv5, tr.row_srv6]
    .forEach((r) => th.bullet("▸", `${r[0]} · porta ${r[1]} — ${r[2]}`));

  // ─── 7. MERCADO ───
  th.section("7", tr.sec7);
  th.para(tr.sec7_body);
  th.sub(tr.sec7_sub1);
  cardGroup(th, tr.card_pme, tr.card_pme_items);
  cardGroup(th, tr.card_ent, tr.card_ent_items);
  th.sub(tr.sec7_sub2);
  th.bullets([tr.why1, tr.why2, tr.why3, tr.why4].map((w) => ({ icon: "▸", text: w })));

  // ─── 8. MODELO DE NEGÓCIO ───
  th.section("8", tr.sec8);
  th.sub(tr.sec8_sub1);
  cardGroup(th, tr.card_saas, tr.card_saas_items);
  cardGroup(th, tr.card_rev, tr.card_rev_items);
  th.sub(tr.sec8_sub2);
  th.para(tr.sec8_body);
  th.sub(tr.sec8_sub3);
  [tr.row_rev1, tr.row_rev2, tr.row_rev3]
    .forEach((r) => th.bullet("▸", `${r[0]} · ${r[1]} clientes · ${r[2]} · ${r[3]} — ${r[4]}`));

  // ─── 9. CONCORRÊNCIA & DIFERENCIAIS ───
  th.section("9", tr.sec9);
  th.sub(tr.sec9_sub1);
  [tr.row_comp1, tr.row_comp2, tr.row_comp3, tr.row_comp4, tr.row_comp5]
    .forEach((r) => th.bullet("▸", `${r[0]} — ${r[1]}; ${r[2]}`));
  th.sub(tr.sec9_sub2);
  th.bullets([tr.moat1, tr.moat2, tr.moat3, tr.moat4].map((m) => ({ icon: "▸", text: m })));

  // ─── 10. ROADMAP ───
  th.section("10", tr.sec10);
  th.sub(tr.r501);
  th.bullets([tr.r501_1, tr.r501_2, tr.r501_3, tr.r501_4].map((b) => ({ icon: "▸", text: b })));
  th.sub(tr.r511);
  th.bullets([tr.r511_1, tr.r511_2, tr.r511_3, tr.r511_4].map((b) => ({ icon: "▸", text: b })));
  th.sub(tr.r601);
  th.bullets([tr.r601_1, tr.r601_2, tr.r601_3, tr.r601_4].map((b) => ({ icon: "▸", text: b })));

  // ─── 11. PEDIDO DE INVESTIMENTO ───
  th.section("11", tr.sec11);
  th.para(tr.sec11_body);
  th.sub(tr.sec11_sub1);
  [tr.row_f1, tr.row_f2, tr.row_f3, tr.row_f4].forEach((r) => th.kv(r[0], r[1]));
  th.sub(tr.sec11_sub2);
  th.bullets([tr.opp1, tr.opp2, tr.opp3, tr.opp4].map((o) => ({ icon: "▸", text: o })));

  // ─── 12. CONTATO ───
  th.section("12", tr.sec12);
  th.title(`${tr.ct_line1} ${tr.ct_line2}`, 22);
  th.sub(tr.ct_name);
  th.para(tr.ct_sub, 11, "#64748b");
  th.rule();
  th.bullet("▸", tr.ct_pedro);
  th.bullet("▸", tr.ct_trinnity);
  th.para(tr.ct_contact, 10.5, "#334155");
  th.para(tr.ct_gh, 10.5, "#334155");
  th.para(tr.ct_dash, 10.5, "#334155");
  th.spacer(1);
  th.para(tr.ct_cr, 9, "#94a3b8");

  th.finish(OUTPUT);
  setTimeout(() => {
    const size = fs.statSync(OUTPUT).size;
    console.log(`✅ ${meta.file} gerado (${meta.label}) — ${(size / 1024).toFixed(1)} KB`);
  }, 800);
}

// ═══════════════════════════════════════════════════════════════════
// RUN — gera os 3 idiomas
// ═══════════════════════════════════════════════════════════════════
const langs: Lang[] = ["pt", "es", "en"];
langs.forEach((l) => buildPDF(l));

