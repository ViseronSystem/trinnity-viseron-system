export interface MailTemplate {
  subject: string;
  text: string;
  html: string;
}

function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0b0f1a;font-family:Arial,Helvetica,sans-serif;color:#e6ecff">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0f1a;padding:24px 0">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#141a2b;border:1px solid #2a3352;border-radius:12px;overflow:hidden">
        <tr><td style="padding:24px 28px;background:linear-gradient(90deg,#4f8cff,#7c5cff)">
          <div style="color:#ffffff;font-size:20px;font-weight:bold">TRINNITY VISERON SYSTEM</div>
        </td></tr>
        <tr><td style="padding:28px">
          <h2 style="margin:0 0 12px;color:#ffffff;font-size:18px">${title}</h2>
          ${body}
        </td></tr>
        <tr><td style="padding:16px 28px;background:#0e1322;color:#8a93b8;font-size:12px">
          Trinnity Viseron System · www.trinnityviseronsystem.io · Responde por Pedro Costa e Trinnity Hurtado
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function p(text: string): string {
  return `<p style="margin:0 0 14px;line-height:1.6;color:#cdd6f0">${text}</p>`;
}

function button(url: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0"><tr><td>
    <a href="${url}" style="display:inline-block;background:#4f8cff;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:bold">${label}</a>
  </td></tr></table>`;
}

export function welcomeEmail(name: string, org: string, dashboardUrl: string): MailTemplate {
  const title = `Bem-vindo ao Viseron, ${name}!`;
  return {
    subject: title,
    text: `Olá ${name},\n\nA tua organização "${org}" foi criada com um trial de 14 dias no plano free.\nEntra no dashboard para configurar os teus agentes:\n${dashboardUrl}\n\n— Trinnity Viseron System`,
    html: layout(title, p(`Olá <b>${name}</b>,`) + p(`A tua organização <b>${org}</b> foi criada com um trial de 14 dias. Já podes configurar os teus agentes e aplicar os templates do onboarding.`) + button(dashboardUrl, "Abrir dashboard")),
  };
}

export function verificationEmail(name: string, code: string, url: string): MailTemplate {
  const title = `Verifica o teu email`;
  return {
    subject: title,
    text: `Olá ${name},\n\nO teu código de verificação é: ${code}\nOu abre o link:\n${url}\n\nVálido por 15 minutos.`,
    html: layout(title, p(`Olá <b>${name}</b>,`) + p(`Usa o código abaixo para verificar o teu email:`) +
      `<div style="font-size:28px;font-weight:bold;letter-spacing:6px;color:#4f8cff;margin:8px 0 16px">${code}</div>` +
      p(`Ou clica no botão:`) + button(url, "Verificar email")),
  };
}

export function resetPasswordEmail(name: string, code: string, url: string): MailTemplate {
  const title = `Repor a tua password`;
  return {
    subject: title,
    text: `Olá ${name},\n\nPede a tua password com o código: ${code}\nOu abre o link:\n${url}\n\nVálido por 15 minutos. Se não foste tu, ignora este email.`,
    html: layout(title, p(`Olá <b>${name}</b>,`) + p(`Recebemos um pedido de reposição de password. Usa o código abaixo:`) +
      `<div style="font-size:28px;font-weight:bold;letter-spacing:6px;color:#4f8cff;margin:8px 0 16px">${code}</div>` +
      p(`Ou clica no botão:`) + button(url, "Repor password") + p(`Se não pediste, ignora este email.`)),
  };
}

export function invoiceEmail(name: string, plan: string, amount: string, dashboardUrl: string): MailTemplate {
  const title = `Recibo da subscrição ${plan}`;
  return {
    subject: title,
    text: `Olá ${name},\n\nO pagamento do plano ${plan} (${amount}) foi confirmado. Obrigado!\n\n— Trinnity Viseron System`,
    html: layout(title, p(`Olá <b>${name}</b>,`) + p(`O pagamento do plano <b>${plan}</b> no valor de <b>${amount}</b> foi confirmado com sucesso.`) + button(dashboardUrl, "Ver subscrição")),
  };
}

export function agentReplyEmail(name: string, reply: string): MailTemplate {
  const title = `O teu agente respondeu`;
  return {
    subject: title,
    text: `Olá ${name},\n\nO teu agente Viseron respondeu:\n\n${reply}\n\n— Trinnity Viseron System`,
    html: layout(title, p(`Olá <b>${name}</b>,`) + p(`O teu agente Viseron respondeu ao teu pedido:`) +
      `<div style="background:#0e1322;border-left:4px solid #7c5cff;padding:14px 16px;margin:8px 0 16px;color:#e6ecff;border-radius:8px">${reply}</div>`),
  };
}
