const fs = require('fs');
const { execSync } = require('child_process');

const md = fs.readFileSync('data/Viseron_Analisis_Patentes.md', 'utf8');

// Simple HTML conversion
let html = md
  .replace(/^# (.+)$/gm, '<h1 style="text-align:center;color:#1a1a2e;font-size:28px;">$1</h1>')
  .replace(/^## (.+)$/gm, '<h2 style="color:#16213e;font-size:22px;border-bottom:2px solid #0f3460;padding-bottom:5px;">$1</h2>')
  .replace(/^### (.+)$/gm, '<h3 style="color:#0f3460;font-size:18px;">$1</h3>')
  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  .replace(/^- (.+)$/gm, '<li>$1</li>')
  .replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

// Handle tables
const lines = html.split('\n');
let inTable = false;
let tableHtml = '';
let result = [];

for (const line of lines) {
  if (line.trim().startsWith('|')) {
    if (!inTable) {
      inTable = true;
      tableHtml = '<table><tr>';
      const cells = line.split('|').filter(c => c.trim());
      tableHtml += cells.map(c => `<th style="background:#0f3460;color:white;padding:8px;">${c.trim()}</th>`).join('');
      tableHtml += '</tr>';
    } else {
      const cells = line.split('|').filter(c => c.trim());
      if (cells.some(c => c.trim().match(/^-+$/))) continue; // skip separator row
      tableHtml += '<tr>' + cells.map(c => `<td style="border:1px solid #ddd;padding:8px;">${c.trim()}</td>`).join('') + '</tr>';
    }
  } else {
    if (inTable) {
      tableHtml += '</table>';
      result.push(tableHtml);
      inTable = false;
    }
    result.push(line);
  }
}
if (inTable) {
  tableHtml += '</table>';
  result.push(tableHtml);
}

html = result.join('\n').replace(/\n\n/g, '<br><br>');

const fullHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 40px; color: #1a1a2e; line-height: 1.6; }
  h1 { color: #0f3460; }
  h2 { color: #16213e; }
  h3 { color: #0f3460; }
  table { border-collapse: collapse; width: 100%; margin: 20px 0; }
  th { background: #0f3460; color: white; padding: 10px; text-align: left; }
  td { border: 1px solid #ddd; padding: 8px; }
  li { margin: 5px 0; }
  .footer { text-align: center; margin-top: 40px; color: #666; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px; }
  strong { color: #0f3460; }
</style>
</head>
<body>
${html}
<div class="footer">
  <p><strong>© Pedro Costa (Comandante) · Trinnity Hurtado (Rainha)</strong></p>
  <p>Trinnity Viseron System v7.0.0 — ${new Date().toISOString().split('T')[0]}</p>
</div>
</body>
</html>`;

fs.writeFileSync('data/Viseron_Analisis_Patentes.html', fullHtml);
console.log('HTML generated: data/Viseron_Analisis_Patentes.html');
