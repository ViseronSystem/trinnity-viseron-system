/**
 * CONTRATO ESTRUTURADO DE TOOL-CALLS — REAL USER VERTICAL SLICE.
 *
 * O modelo usado (Ollama qwen2.5:3b) NÃO tem garantia de tool-calling nativo;
 * por isso o VISERON BUILDER usa uma camada de structured-output explícita:
 *
 *   1. O prompt obriga o modelo a emitir chamadas em blocos rígidos
 *      `TOOL_CALL_START {json} TOOL_CALL_END` (um por ferramenta).
 *   2. `parseToolCalls()` extrai e desserializa os blocos JSON.
 *   3. `validateToolCall()` valida o schema (args obrigatórios) ANTES de executar.
 *   4. `injectRuntimeArgs()` injeta tenantId/projectId/autorização do payload.
 *
 * Regra de honra: sem bloco TOOL_CALL válido → ZERO execução. Nunca se
 * inventa execução nem sucesso — o kernel devolve tools vazias e o verifier
 * reprova a tarefa (obrigatórias N/N).
 */

export const WORKSPACE_FS_WRITE = "workspace_fs_write";
export const WORKSPACE_TEST_RUN = "workspace_test_run";

export const TOOL_CALL_START = "TOOL_CALL_START";
export const TOOL_CALL_END = "TOOL_CALL_END";
export const NO_TOOL_CALL = "NO_TOOL_CALL";

export interface ToolCallShape {
  tool: string;
  arguments: Record<string, any>;
}

export interface ToolCallValidation {
  ok: boolean;
  errors: string[];
}

/** Tool-call pronta a executar (com args injetados) + validação de schema. */
export interface ToolCallResult {
  call: ToolCallShape;
  validation: ToolCallValidation;
}

export interface ToolSchemaParam {
  type: "string" | "number" | "boolean" | "object";
  required?: boolean;
  description?: string;
}

export interface ToolSchema {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, ToolSchemaParam>;
}

export const WORKSPACE_TOOL_SCHEMAS: ToolSchema[] = [
  {
    id: WORKSPACE_FS_WRITE,
    name: "Workspace File Write",
    description: "Escreve um ficheiro REAL no sandbox do projeto do utilizador (isolamento por tenant).",
    parameters: {
      fileName: { type: "string", required: true, description: "nome do ficheiro — só letras, números, ponto, underscore ou hífen (ex.: README.md)" },
      content: { type: "string", description: "conteúdo do ficheiro (texto/marcação)" },
    },
  },
  {
    id: WORKSPACE_TEST_RUN,
    name: "Workspace Test Run",
    description: "Executa um teste REAL (node -e) no sandbox do projeto; devolve exitCode/stdout/stderr/passed.",
    parameters: {
      script: { type: "string", required: true, description: "código JS do teste (usa require('fs') para verificar ficheiros escritos; process.exit(1) se falhar)" },
    },
  },
];

/** Extrai as tool-calls estruturadas do texto gerado pelo modelo. */
export function parseToolCalls(text: string): ToolCallShape[] {
  const calls: ToolCallShape[] = [];
  if (!text) return calls;
  const re = new RegExp(`${TOOL_CALL_START}\\s*([\\s\\S]*?)\\s*${TOOL_CALL_END}`, "g");
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const raw = match[1].trim();
    const block = extractJsonBlock(raw);
    const parsed = tryParseJson(raw) ?? (block ? tryParseJson(block) : null);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) continue;
    const tool = String((parsed as any).tool ?? "");
    if (!tool) continue;
    const args = (parsed as any).arguments;
    calls.push({
      tool,
      arguments: args && typeof args === "object" && !Array.isArray(args) ? { ...args } : {},
    });
  }
  return calls;
}

/** Valida a tool-call contra o schema ANTES de qualquer execução. */
export function validateToolCall(call: ToolCallShape): ToolCallValidation {
  const schema = WORKSPACE_TOOL_SCHEMAS.find((s) => s.id === call.tool);
  if (!schema) return { ok: false, errors: [`tool desconhecida: ${call.tool}`] };
  const errors: string[] = [];
  for (const [name, param] of Object.entries(schema.parameters)) {
    if (param.required) {
      const v = call.arguments?.[name];
      if (v === undefined || v === null || v === "") errors.push(`${name} obrigatório`);
    }
  }
  return { ok: errors.length === 0, errors };
}

/** Injeta os args de runtime (tenantId/projectId/autorização) numa tool-call. */
export function injectRuntimeArgs(
  call: ToolCallShape,
  runtime: { tenantId?: string; projectId?: string; authorized?: boolean }
): ToolCallShape {
  const arguments_ = { ...(call.arguments ?? {}) };
  if (runtime.tenantId) arguments_.tenantId = String(runtime.tenantId);
  if (runtime.projectId) arguments_.projectId = String(runtime.projectId);
  if (runtime.authorized) arguments_.authorized = true;
  return { tool: call.tool, arguments: arguments_ };
}

/** Prompt da fase de planificação: schema + sugestões do utilizador + formato rígido. */
export function buildToolPlanPrompt(description: string, ctx?: Record<string, any>): string {
  const specs = Array.isArray(ctx?.toolSpecs) ? ctx.toolSpecs : [];
  const schemasText = WORKSPACE_TOOL_SCHEMAS.map((s) => {
    const params = Object.entries(s.parameters)
      .map(([name, p]) => `    - ${name} (${p.type})${p.required ? " — OBRIGATÓRIO" : " — opcional"}: ${p.description ?? ""}`)
      .join("\n");
    return `  ${s.id} — ${s.description}\n${params}`;
  }).join("\n");
  const hints = specs
    .map((s: any) => `  - ${s?.id ?? "?"}: ${JSON.stringify(s?.input ?? {})}`)
    .join("\n");
  // Lista numerada das ferramentas PEDIDAS — o modelo pequeno responde melhor
  // quando cada uma é uma instrução explícita a cumprir (uma TOOL_CALL por cada).
  const requiredList = specs
    .map((s: any, i: number) => `  ${i + 1}. ${s?.id ?? "?"} — emite UM bloco TOOL_CALL para esta ferramenta.`)
    .join("\n");
  const requiredCount = specs.length;
  const planInstructions = requiredCount > 0
    ? [
        `El usuario pidió ${requiredCount} herramienta(s). Debes emitir EXACTAMENTE ${requiredCount} bloque(s) TOOL_CALL — UNO por cada herramienta listada, en este orden:`,
        requiredList,
        `Repite el bloque TOOL_CALL_START/END para CADA herramienta. No te detengas después de la primera.`,
      ]
    : [
        "Analiza la tarea. Si requiere herramientas, emite un bloque TOOL_CALL por cada una.",
      ];
  return [
    "Eres el VISERON BUILDER del Trinnity Viseron System: agente real que ejecuta las tareas del usuario con herramientas REALES.",
    "",
    "TAREA DEL USUARIO:",
    description,
    "",
    "HERRAMIENTAS DISPONIBLES (schema):",
    schemasText,
    "",
    "VALORES SUGERIDOS POR EL USUARIO (úsalos si proceden; tenantId/projectId/autorización los inyecta el sistema):",
    hints || "  (ninguno)",
    "",
    ...planInstructions,
    "",
    "FORMATO EXACTO de cada bloque (UNO por herramienta, JSON válido en una línea):",
    `${TOOL_CALL_START}`,
    `{"tool":"<id>","arguments":{...}}`,
    `${TOOL_CALL_END}`,
    "",
    "Ejemplo con DOS herramientas (escribir fichero y después testearlo) — observa que hay DOS bloques:",
    `${TOOL_CALL_START}`,
    `{"tool":"${WORKSPACE_FS_WRITE}","arguments":{"fileName":"README.md","content":"# Proyecto\\nGenerado por VISERON."}}`,
    `${TOOL_CALL_END}`,
    `${TOOL_CALL_START}`,
    `{"tool":"${WORKSPACE_TEST_RUN}","arguments":{"script":"const fs=require('fs');if(!fs.existsSync('README.md'))process.exit(1);console.log('TEST OK');"}}`,
    `${TOOL_CALL_END}`,
    "",
    `Si la tarea NO requiere herramientas, escribe ${NO_TOOL_CALL} seguido de una breve explicación.`,
    "NO escribas texto fuera de los bloques TOOL_CALL en este turno de planificación. Empieza YA con el primer bloque.",
  ].join("\n");
}

/** Prompt da fase final: o modelo escreve o relatório com os resultados reais. */
export function buildToolFinalPrompt(description: string, tools: any[]): string {
  const summary = (Array.isArray(tools) && tools.length > 0 ? tools : [])
    .map((t) => `  - ${t?.toolId ?? "?"}: success=${t?.success === true} result=${t?.result ? JSON.stringify(t.result) : (t?.error ?? "—")}`)
    .join("\n");
  return [
    "Eres el VISERON BUILDER. La ejecución de herramientas ya terminó.",
    "",
    "TAREA ORIGINAL:",
    description,
    "",
    "RESULTADOS DE LAS HERRAMIENTAS:",
    summary || "  (ninguna herramienta ejecutada)",
    "",
    "Escribe el INFORME FINAL en 2-4 frases, en el idioma del usuario (es/pt/en), resumiendo qué se ejecutó y el estado real.",
  ].join("\n");
}

function tryParseJson(raw: string): any | null {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function extractJsonBlock(raw: string): string | null {
  const m = raw.match(/\{[\s\S]*\}/);
  return m ? m[0] : null;
}
