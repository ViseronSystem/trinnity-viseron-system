export interface OnboardingAgent {
  name: string;
  role: string;
  capabilities: string[];
  prompt: string;
}

export interface OnboardingTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  agents: OnboardingAgent[];
  tools: string[];
}

export const ONBOARDING_TEMPLATES: OnboardingTemplate[] = [
  {
    id: "conteudo",
    name: "Marketing de Conteúdo",
    icon: "📝",
    description: "Agentes que planeiam, escrevem, revêem e publicam conteúdo no blog automaticamente.",
    tools: ["blog", "content-generate", "seo"],
    agents: [
      { name: "Editor-Chefe", role: "Planeador", capabilities: ["pesquisa", "planeamento", "calendário"], prompt: "Define o calendário editorial semanal baseado em tendências e palavras-chave." },
      { name: "Escritor", role: "Redator", capabilities: ["escrita", "blog", "markdown"], prompt: "Redige artigos completos em português/espanhol/inglês com SEO." },
      { name: "Revisor", role: "Editor", capabilities: ["revisão", "gramática", "SEO"], prompt: "Revisa e otimiza artigos para qualidade e ranqueamento." },
      { name: "Publicador", role: "Distribuidor", capabilities: ["publicação", "agendamento"], prompt: "Publica o conteúdo aprovado no blog e nas redes sociais." },
    ],
  },
  {
    id: "atendimento",
    name: "Atendimento ao Cliente",
    icon: "🤝",
    description: "Agentes que respondem, classificam e escalam tickets de suporte em qualquer canal.",
    tools: ["tickets", "email", "whatsapp", "knowledge-base"],
    agents: [
      { name: "Triador", role: "Classificador", capabilities: ["triagem", "classificação", "priorização"], prompt: "Classifica cada pedido por urgência, assunto e cliente." },
      { name: "Resolvedor", role: "Suporte N1", capabilities: ["respostas", "knowledge-base", "resolução"], prompt: "Resolve pedidos comuns usando a base de conhecimento em <5 min." },
      { name: "Escalador", role: "Suporte N2", capabilities: ["escalamento", "reparos", "follow-up"], prompt: "Escala casos complexos com contexto completo e faz follow-up." },
    ],
  },
  {
    id: "codigo",
    name: "Automação de Código",
    icon: "💻",
    description: "Agentes que revisam, corrigem e documentam código no repositório.",
    tools: ["git", "code-review", "tests", "documentation"],
    agents: [
      { name: "Revisor", role: "Code Reviewer", capabilities: ["revisão", "segurança", "qualidade"], prompt: "Revê PRs, aponta bugs e vulnerabilidades com prioridade." },
      { name: "Corretor", role: "Fixer", capabilities: ["correção", "refactoring", "tests"], prompt: "Implementa correções e garante que os testes passam." },
      { name: "Documentador", role: "Tech Writer", capabilities: ["documentação", "changelog", "readme"], prompt: "Mantém README, changelog e docs atualizados." },
    ],
  },
  {
    id: "squad-aiox",
    name: "Squad AIOX — Engenharia de Sistemas (NASA)",
    icon: "🚀",
    description: "200 anos de experiência combinada em engenharia de sistemas, aviônica e missões críticas. Squad de elite que executa, valida e garante cada deploy.",
    tools: ["sistemas", "qa", "resiliencia", "deploy", "documentation"],
    agents: [
      { name: "AIOX-1 Systems", role: "Chief Systems Engineer", capabilities: ["arquitetura", "sistemas-críticos", "NASA-STD"], prompt: "Aplica padrões de engenharia de sistemas (NASA-STD-8719) a cada componente." },
      { name: "AIOX-2 Avionics", role: "Flight Software Engineer", capabilities: ["software", "redundância", "fail-safe"], prompt: "Garante software com tolerância a falhas e redundância de missão." },
      { name: "AIOX-3 Mission", role: "Mission Assurance", capabilities: ["qualidade", "verificação", "rastreabilidade"], prompt: "Verifica cada requisito com rastreabilidade e prova de execução." },
      { name: "AIOX-4 Operations", role: "Ground Operations", capabilities: ["operações", "monitorização", "procedimentos"], prompt: "Define e monitoriza procedimentos operacionais de produção." },
      { name: "AIOX-5 Launch", role: "Launch Director", capabilities: ["go-no-go", "checklist", "deploy"], prompt: "Dá go/no-go para cada lançamento (deploy) com checklist completa." },
    ],
  },
  {
    id: "arkom",
    name: "Arkom — Supervisão de Comando",
    icon: "👑",
    description: "Camada de supervisão dos agentes, dirigida por Pedro Costa (Commander) e Trinnity Hurtado (Queen). Assegura alinhamento com a missão.",
    tools: ["supervisão", "directives", "audit", "governance"],
    agents: [
      { name: "Arkom-Observer", role: "Supervisor", capabilities: ["observação", "auditoria", "alinhamento"], prompt: "Observa todos os agentes e reporta desvios de missão." },
      { name: "Arkom-Guardian", role: "Guardian", capabilities: ["proteção", "core-protection", "segurança"], prompt: "Protege o core do sistema de ações arriscadas." },
      { name: "Arkom-Executor", role: "Executor", capabilities: ["execução", "directives", "resultados"], prompt: "Executa diretivas de Pedro e Trinnity com prioridade máxima." },
    ],
  },
];

export function getTemplate(id: string): OnboardingTemplate | undefined {
  return ONBOARDING_TEMPLATES.find((t) => t.id === id);
}
