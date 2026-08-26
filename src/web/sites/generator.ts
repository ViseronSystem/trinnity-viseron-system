import { askLocalAI } from "../calls/learning";
import { SiteMeta, SiteStore, slugify } from "./store";

interface SiteContent {
  tagline: string;
  paragraph: string;
  features: string[];
  cta: string;
}

const ACCENTS = ["#22d3ee", "#a78bfa", "#34d399", "#f472b6", "#fbbf24"];

function pickAccent(name: string): string {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return ACCENTS[h % ACCENTS.length];
}

function fallbackContent(name: string, description: string): SiteContent {
  return {
    tagline: `${name} — inteligência que constrói o futuro.`,
    paragraph: description.slice(0, 300),
    features: [
      "Automação real com inteligência artificial",
      "Operação contínua 24/7 sem fricção",
      "Escalabilidade preparada para o mercado",
    ],
    cta: "Falar com a equipa",
  };
}

async function aiContent(name: string, description: string): Promise<SiteContent> {
  const prompt = `Create a modern landing page for a business/product called "${name}". Business description: ${description.slice(0, 1200)}

Return STRICT JSON only with keys: tagline (short powerful tagline, max 12 words), paragraph (one marketing paragraph, 3-4 sentences), features (exactly 3 feature strings, each max 8 words), cta (call to action, max 4 words). Write everything in English.`;

  const raw = await askLocalAI(prompt, "You output only valid JSON, nothing else.");
  if (raw) {
    try {
      const parsed = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || "{}");
      if (typeof parsed.tagline === "string" && parsed.tagline.trim()) {
        return {
          tagline: String(parsed.tagline).slice(0, 140),
          paragraph: String(parsed.paragraph || description).slice(0, 600),
          features: Array.isArray(parsed.features) && parsed.features.length >= 3 ? parsed.features.map(String).slice(0, 3) : fallbackContent(name, description).features,
          cta: String(parsed.cta || "Get in touch").slice(0, 60),
        };
      }
    } catch {}
  }
  return fallbackContent(name, description);
}

function renderHtml(meta: SiteMeta, content: SiteContent): string {
  const features = content.features
    .map((f, i) => `<div class="card"><div class="num">0${i + 1}</div><p>${esc(f)}</p></div>`)
    .join("");
  const json = {
    brand: meta.name,
    tagline: content.tagline,
    paragraph: content.paragraph,
    features: content.features,
    cta: content.cta,
    pt: {
      nav: "Início", feat: "Recursos", cta: content.cta,
      heroBtn: "Começar agora", madeBy: "Site criado pelo Trinnity Viseron System — IA autónoma.",
    },
    en: {
      nav: "Home", feat: "Features", cta: content.cta,
      heroBtn: "Get started", madeBy: "Site built by Trinnity Viseron System — autonomous AI.",
    },
    es: {
      nav: "Inicio", feat: "Características", cta: content.cta,
      heroBtn: "Empezar", madeBy: "Sitio creado por Trinnity Viseron System — IA autónoma.",
    },
  };
  return `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${esc(meta.name)} — ${esc(content.tagline)}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Inter,system-ui,-apple-system,sans-serif;background:#05060f;color:#e2e8f0;min-height:100vh;overflow-x:hidden}
.glow{position:fixed;inset:0;pointer-events:none;background:radial-gradient(60% 40% at 70% 10%,${meta.accent}22,transparent),radial-gradient(40% 30% at 15% 85%,#7c3aed22,transparent)}
header{display:flex;justify-content:space-between;align-items:center;padding:24px 40px;position:relative}
.brand{font-weight:800;font-size:20px;letter-spacing:.3px;background:linear-gradient(90deg,#fff,${meta.accent});-webkit-background-clip:text;background-clip:text;color:transparent}
.nav{display:flex;gap:22px;align-items:center;font-size:14px}
.nav a{color:#94a3b8;text-decoration:none}
.lang{border:1px solid #ffffff22;border-radius:999px;padding:5px 14px;cursor:pointer;background:transparent;color:#cbd5e1;font-size:13px}
main{padding:80px 40px 40px;position:relative;max-width:1080px;margin:0 auto;text-align:center}
.badge{display:inline-block;border:1px solid ${meta.accent}44;color:${meta.accent};border-radius:999px;padding:6px 16px;font-size:12px;letter-spacing:1px;text-transform:uppercase;margin-bottom:28px}
h1{font-size:clamp(38px,6vw,72px);line-height:1.05;font-weight:800;letter-spacing:-1px}
h1 em{font-style:normal;background:linear-gradient(90deg,${meta.accent},#7c3aed);-webkit-background-clip:text;background-clip:text;color:transparent}
p.sub{max-width:640px;margin:24px auto 0;color:#94a3b8;font-size:18px;line-height:1.6}
.cta-row{margin-top:36px;display:flex;gap:14px;justify-content:center;flex-wrap:wrap}
.btn{border:none;border-radius:12px;padding:14px 28px;font-size:15px;font-weight:700;cursor:pointer;background:linear-gradient(90deg,${meta.accent},#7c3aed);color:#05060f}
.btn.ghost{background:transparent;border:1px solid #ffffff22;color:#e2e8f0}
.feats{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin:80px auto 0;max-width:960px;text-align:left}
.card{border:1px solid #ffffff12;background:#0a0c1a;border-radius:16px;padding:26px;transition:.25s}
.card:hover{border-color:${meta.accent}66;transform:translateY(-4px)}
.num{font-size:12px;color:${meta.accent};font-weight:800;letter-spacing:1px;margin-bottom:12px}
.card p{color:#cbd5e1;font-size:15px;line-height:1.5}
footer{margin-top:100px;padding:26px;text-align:center;color:#475569;font-size:13px;position:relative}
@media(max-width:760px){.feats{grid-template-columns:1fr}header{padding:20px}h1{font-size:36px}}
</style>
</head>
<body>
<div class="glow"></div>
<header>
  <div class="brand" data-i18n="brand">${esc(meta.name)}</div>
  <div class="nav">
    <a href="#" data-i18n="nav">Início</a>
    <a href="#feat" data-i18n="feat">Recursos</a>
    <button class="lang" onclick="setLang('pt')">PT</button>
    <button class="lang" onclick="setLang('en')">EN</button>
    <button class="lang" onclick="setLang('es')">ES</button>
  </div>
</header>
<main>
  <div class="badge">✨ TVS AI Powered</div>
  <h1><span data-i18n="tagline1">${esc(content.tagline)}</span></h1>
  <p class="sub" data-i18n="paragraph">${esc(content.paragraph)}</p>
  <div class="cta-row">
    <button class="btn" data-i18n="heroBtn">Começar agora</button>
    <button class="btn ghost" data-i18n="cta">${esc(content.cta)}</button>
  </div>
  <div class="feats" id="feat">
    ${features}
  </div>
</main>
<footer data-i18n="madeBy">Site criado pelo Trinnity Viseron System — IA autónoma.</footer>
<script>
const I18N=${JSON.stringify(json)};
function setLang(l){localStorage.setItem('lang',l);document.documentElement.lang=l;
document.querySelectorAll('[data-i18n]').forEach(el=>{const k=el.getAttribute('data-i18n');if(I18N[l]&&I18N[l][k])el.textContent=I18N[l][k];});}
setLang(localStorage.getItem('lang')||'pt');
</script>
</body>
</html>`;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function generateSite(name: string, description: string, lang: "pt" | "en" | "es" = "pt"): Promise<{ meta: SiteMeta; html: string }> {
  const content = await aiContent(name, description);
  const meta: SiteMeta = {
    slug: slugify(name),
    name: name.trim().slice(0, 80),
    description: description.trim().slice(0, 1500),
    tagline: content.tagline,
    features: content.features,
    cta: content.cta,
    accent: pickAccent(name),
    lang,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const html = renderHtml(meta, content);
  return { meta, html };
}

export async function createSite(store: SiteStore, name: string, description: string, lang: "pt" | "en" | "es" = "pt"): Promise<{ meta: SiteMeta; htmlPath: string }> {
  const { meta, html } = await generateSite(name, description, lang);
  store.writeHtml(meta.slug, html);
  const result = store.get(meta.slug)!;
  store.save({ meta, htmlPath: result.htmlPath });
  return { meta, htmlPath: result.htmlPath };
}
