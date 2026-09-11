/**
 * VISERON™ Branding — Third-party → Proprietary renames
 * Renomeia todas as referências de skills/repos de terceiros para nomes VISERON
 * © Pedro Costa · Trinnity Hurtado — VISERON™
 */

export const BRAND_MAP: Record<string, string> = {
  // Third-party → VISERON Proprietary (short names)
  'claude-plugins-official': 'viperon-plugins',
  'awesome-claude-skills': 'viperon-skills-collection',
  'affaan-m/ecc': 'viperon-ecc',
  'obra/superpowers': 'viperon-superpowers',
  'trycompai/crm': 'viperon-crm',
  'trycompai/comp': 'viperon-compliance',
  'HKUDS/DeepTutor': 'viperon-deeptutor',
  'cobusgreyling/loop-engineering': 'viperon-loop',
  'Graphify-Labs/graphify': 'viperon-graphify',
  'graphify': 'viperon-graphify',
  'Graphify': 'Viperon Graphify',
  'GRAPHIFY': 'VIPERON-GRAPHIFY',
  
  // Repo naming (full paths)
  'anthropics/claude-plugins-official': 'trinnity/viseron-plugins',
  'ComposioHQ/awesome-claude-skills': 'trinnity/viseron-skills',
  'affaan-m/ECC': 'trinnity/viseron-ecc',
  
  // Display names
  'ECC': 'VISERON ECC',
  'Comp AI CRM': 'VISERON CRM',
  'Comp AI': 'VISERON Compliance',
  'DeepTutor': 'VISERON Tutor',
  'Loop Engineering': 'VISERON Loop',
  'Superpowers': 'VISERON Superpowers',
  'Claude Plugins': 'VISERON Plugins',
  'Awesome Claude Skills': 'VISERON Skills Collection',
};

/**
 * Replace brand references in a string
 */
export function rebrand(text: string): string {
  let result = text;
  for (const [from, to] of Object.entries(BRAND_MAP)) {
    result = result.split(from).join(to);
  }
  return result;
}

/**
 * Get branded name for a skill/repo
 */
export function getBrandName(name: string): string {
  return BRAND_MAP[name] || name;
}

/**
 * List all brand mappings
 */
export function listBrands(): Array<{ original: string; branded: string }> {
  return Object.entries(BRAND_MAP).map(([original, branded]) => ({
    original,
    branded,
  }));
}
