/**
 * Campaign Engine — Generates personalized RCS/SMS/WhatsApp messages for 526K leads
 * Uses AI (Ollama/local) for personalization, integrates with Twilio for sending
 */
import * as fs from "fs";
import * as path from "path";
import { Lead, Campaign, CampaignMessage, LeadStore } from "./LeadStore";

// ---- MESSAGE TEMPLATES ----

const TEMPLATES = {
  // Telecom segment templates
  telecom: {
    es: {
      rcs: [
        "¡Hola {nombre}! 🎯 Soy del equipo VISERON. {operator}, tu operador actual, cobra {tarifa}/mes. ¿Te gustaría una alternativa con {beneficio} por solo {precio}? Responde SÍ para más info.",
        "{nombre}, ¿sabías que puedes ahorrar hasta 40% en tu factura de {operator}? VISERON tiene planes desde {precio}/mes con {beneficio}. Escríbenos para comparar.",
        "¡{nombre}! 🚀 Oferta exclusiva para clientes de {operator} en {provincia}: {beneficio} por {precio}/mes. Solo por tiempo limitado. Responde INFO."
      ],
      sms: [
        "VISERON: {nombre}, alternativa a {operator} con {beneficio} por {precio}/mes. Responde INFO para comparar tu factura actual.",
        "Hola {nombre}, ¿tu factura de {operator} supera {tarifa}? Tenemos {beneficio} por {precio}/mes. Info: responde YES"
      ],
      whatsapp: [
        "Hola {nombre} 👋 Soy de Trinnity Viseron System. Veo que eres cliente de {operator} en {provincia}. Tenemos una propuesta personalizada que te ahorraría dinero. ¿Te interesa?",
        "{nombre}, tengo una oferta especial para ti como cliente de {operator}. {beneficio} por solo {precio}/mes. ¿Quieres que te cuente más?"
      ]
    },
    pt: {
      rcs: [
        "Olá {nombre}! 👋 Sou da equipa VISERON. {operator}, o teu operador atual, cobra {tarifa}/mês. Queres uma alternativa com {beneficio} por apenas {precio}? Responde SIM para mais info.",
        "{nombre}, sabias que podes poupar até 40% na tua fatura da {operator}? VISERON tem planos desde {precio}/mês com {beneficio}. Escreve-nos para comparar."
      ],
      sms: [
        "VISERON: {nombre}, alternativa à {operator} com {beneficio} por {precio}/mês. Responde INFO para comparar.",
        "Olá {nombre}, a tua fatura da {operator} supera {tarifa}? Temos {beneficio} por {precio}/mês. Info: responde YES"
      ],
      whatsapp: [
        "Olá {nombre} 👋 Sou da Trinnity Viseron System. Vejo que és cliente da {operator} em {provincia}. Temos uma proposta personalizada que te pouparia dinheiro. Interessa-te?"
      ]
    }
  },
  // Banking/financial segment templates
  banking: {
    es: {
      rcs: [
        "¡Hola {nombre}! 🏦 VISERON ofrece soluciones financieras con IA. ¿Sabías que puedes optimizar tus finanzas con nuestro asistente autónomo? Responde INFO para una demo gratuita.",
        "{nombre}, como cliente de {banco}, tienes acceso preferente a nuestro AI Finance Manager. Gestiona tus inversiones, pagos y ahorros automáticamente. ¿Quieres saber más?",
        "🚀 {nombre}, tu banco {banco} no ofrece IA financiera. VISERON sí. Ahorra tiempo y dinero con automatización inteligente. Responde SI para empezar."
      ],
      sms: [
        "VISERON: {nombre}, gestiona tus finanzas con IA. Gratis para clientes de {banco}. Responde INFO.",
        "Hola {nombre}, ¿quieres que una IA administre tus finanzas? VISERON Finance: automático, seguro, 24/7. Responde YES"
      ],
      whatsapp: [
        "Hola {nombre} 👋 Soy de Trinnity Viseron System. Creamos un asistente financiero con IA que se conecta con tu banco {banco} para automatizar pagos, detectar gastos y optimizar ahorros. ¿Te interesa una demo?",
        "{nombre}, tengo algo que te va a encantar. Un AI que trabaja para ti 24/7: paga tus facturas, detecta cargos sospechosos y te avisa de ofertas. ¿Lo probamos?"
      ]
    }
  },
  // General business templates
  general: {
    es: {
      rcs: [
        "¡Hola {nombre}! 🤖 VISERON: tu asistente de IA personal. Gestiona emails, calendario, finanzas y más. ¿Quieres probarlo gratis? Responde SI.",
        "{nombre}, ¿y si tuvieras un empleado que trabaja 24/7 por 29€/mes? VISERON AI hace tu trabajo repetitivo. Responde INFO para una demo.",
        "🚀 {nombre}, VISERON automatiza tu negocio con IA. Clientes como tú ahorran 60% en tiempo administrativo. ¿Lo probamos?"
      ],
      sms: [
        "VISERON: Asistente IA personal desde 29€/mes. Automatiza emails, calendario, facturas. Responde INFO para demo gratis.",
        "Hola {nombre}, ¿quieres un empleado AI que trabaje 24/7? VISERON desde 29€/mes. Responde YES"
      ],
      whatsapp: [
        "Hola {nombre} 👋 Soy de Trinnity Viseron System. Tenemos un asistente de IA que puede gestionar tu negocio completo: emails, clientes, facturas, marketing. Todo automático. ¿Te gustaría verlo en acción?",
        "{nombre}, imagina que tuvieras un assistant que nunca duerme, nunca se equivoca y cuesta menos que un café al día. Eso es VISERON. ¿Lo pruebas?"
      ]
    },
    pt: {
      rcs: [
        "Olá {nombre}! 🤖 VISERON: o teu assistente IA pessoal. Gere emails, calendário, finanças e mais. Queres experimentar grátis? Responde SIM.",
        "{nombre}, e se tivesses um funcionário que trabalha 24/7 por 29€/mês? VISERON AI faz o teu trabalho repetitivo. Responde INFO para demo."
      ],
      sms: [
        "VISERON: Assistente IA pessoal desde 29€/mês. Automatiza emails, calendário, facturas. Responde INFO para demo grátis.",
        "Olá {nombre}, queres um funcionário AI que trabalhe 24/7? VISERON desde 29€/mês. Responde YES"
      ],
      whatsapp: [
        "Olá {nombre} 👋 Sou da Trinnity Viseron System. Temos um assistente de IA que pode gerir o teu negócio completo: emails, clientes, facturas, marketing. Tudo automático. Queres ver em ação?"
      ]
    }
  }
};

// ---- BENEFIT / PRICING DATA ----

const BENEFITS = [
  "ilimitadas",
  "fibra óptica 600Mbps",
  "todo incluido",
  "datos ilimitados",
  "fibra + móvil",
  "wifi premium"
];

const PRICES = ["9.99", "12.99", "14.99", "19.99", "24.99", "29.99"];

export class CampaignEngine {
  private store: LeadStore;
  private dataDir: string;

  constructor(store: LeadStore, dataDir: string) {
    this.store = store;
    this.dataDir = dataDir;
  }

  /**
   * Generate personalized messages for a campaign segment
   */
  generateMessages(params: {
    segment: string;
    channel: "rcs" | "sms" | "whatsapp" | "email" | "multi";
    language?: "es" | "pt" | "en";
    limit?: number;
  }): CampaignMessage[] {
    const { segment, channel, language = "es", limit = 1000 } = params;

    const leads = this.store.getLeads({
      channel: channel === "email" ? "email" : "rcs",
      segment: segment as any,
      limit,
    });

    const templates = this.getTemplates(segment, language);
    const channelTemplates = templates[channel] || templates.sms || [];

    const messages: CampaignMessage[] = [];

    for (const lead of leads) {
      const template = channelTemplates[Math.floor(Math.random() * channelTemplates.length)];
      if (!template) continue;

      const content = this.personalize(template, lead);

      messages.push({
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        leadId: lead.id,
        channel: channel === "multi" ? "rcs" : channel,
        content,
        personalization: {
          nombre: lead.name,
          operator: lead.operator || "",
          banco: lead.bank || "",
          provincia: lead.province || "",
          tarifa: lead.tariff || "",
          beneficio: BENEFITS[Math.floor(Math.random() * BENEFITS.length)],
          precio: PRICES[Math.floor(Math.random() * PRICES.length)],
        },
        status: "queued",
      });
    }

    return messages;
  }

  /**
   * Personalize a template with lead data
   */
  private personalize(template: string, lead: Lead): string {
    const beneficio = BENEFITS[Math.floor(Math.random() * BENEFITS.length)];
    const precio = PRICES[Math.floor(Math.random() * PRICES.length)];

    return template
      .replace(/\{nombre\}/g, lead.name)
      .replace(/\{operator\}/g, lead.operator || "tu operador")
      .replace(/\{banco\}/g, lead.bank || "tu banco")
      .replace(/\{provincia\}/g, lead.province || "tu zona")
      .replace(/\{tarifa\}/g, lead.tariff || "29.99")
      .replace(/\{beneficio\}/g, beneficio)
      .replace(/\{precio\}/g, precio);
  }

  private getTemplates(segment: string, language: "es" | "pt" | "en"): Record<string, string[]> {
    if (segment === "telecom" || segment === "platino" || segment === "gold" || segment === "silver" || segment === "bronze") {
      return (TEMPLATES.telecom as any)[language] || TEMPLATES.telecom.es;
    }
    if (segment === "banking" || segment === "general") {
      return (TEMPLATES.banking as any)[language] || TEMPLATES.banking.es;
    }
    return (TEMPLATES.general as any)[language] || TEMPLATES.general.es;
  }

  /**
   * Calculate campaign cost and revenue projection
   */
  calculateCampaignMetrics(params: {
    channel: "rcs" | "sms" | "whatsapp" | "email";
    targetCount: number;
    conversionRate?: number;
    revenuePerConversion?: number;
  }) {
    const costsPerUnit: Record<string, number> = {
      rcs: 0.005,
      sms: 0.01,
      whatsapp: 0.002,
      email: 0.0001,
    };

    const deliveryRates: Record<string, number> = {
      rcs: 0.95,
      sms: 0.98,
      whatsapp: 0.90,
      email: 0.85,
    };

    const responseRates: Record<string, number> = {
      rcs: 0.15,
      sms: 0.05,
      whatsapp: 0.20,
      email: 0.03,
    };

    const costPerUnit = costsPerUnit[params.channel] || 0.01;
    const deliveryRate = deliveryRates[params.channel] || 0.90;
    const responseRate = responseRates[params.channel] || 0.10;
    const conversionRate = params.conversionRate || 0.02;
    const revenuePerConversion = params.revenuePerConversion || 150;

    const totalCost = params.targetCount * costPerUnit;
    const delivered = Math.floor(params.targetCount * deliveryRate);
    const responses = Math.floor(delivered * responseRate);
    const conversions = Math.floor(responses * conversionRate);
    const revenue = conversions * revenuePerConversion;
    const roi = totalCost > 0 ? ((revenue - totalCost) / totalCost) * 100 : 0;

    return {
      channel: params.channel,
      targetCount: params.targetCount,
      costPerUnit,
      totalCost: Math.round(totalCost * 100) / 100,
      delivered,
      deliveryRate: Math.round(deliveryRate * 100),
      responses,
      responseRate: Math.round(responseRate * 100),
      conversions,
      conversionRate: Math.round(conversionRate * 100),
      revenue,
      revenuePerConversion,
      roi: Math.round(roi),
      profit: revenue - totalCost,
    };
  }

  /**
   * Generate full campaign plan with all segments
   */
  generateCampaignPlan(): any {
    const stats = this.store.getStats();

    const segments = Object.keys(stats.bySegment);
    const channels: Array<"rcs" | "sms" | "whatsapp" | "email"> = ["rcs", "sms", "whatsapp", "email"];

    const plans = [];

    for (const segment of segments) {
      const segmentLeads = stats.bySegment[segment] || 0;
      for (const channel of channels) {
        if (channel === "email" && segmentLeads < 100) continue;
        const metrics = this.calculateCampaignMetrics({
          channel,
          targetCount: segmentLeads,
        });
        plans.push({ segment, ...metrics });
      }
    }

    // Add multi-channel total
    const totalMetrics = this.calculateCampaignMetrics({
      channel: "rcs",
      targetCount: stats.byChannel.rcs || 0,
    });

    return {
      totalLeads: stats.total,
      byChannel: stats.byChannel,
      bySegment: stats.bySegment,
      segmentPlans: plans,
      totalMetrics,
      summary: {
        totalReachable: stats.byChannel.rcs + stats.byChannel.sms + stats.byChannel.whatsapp,
        bestChannel: "rcs",
        estimatedCampaignCost: Math.round(totalMetrics.totalCost),
        estimatedRevenue: totalMetrics.revenue,
        estimatedROI: totalMetrics.roi,
      }
    };
  }
}
