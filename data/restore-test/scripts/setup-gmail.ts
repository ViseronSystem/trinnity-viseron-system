import "dotenv/config";
import { gmailAuthUrl, gmailExchangeCode } from "../src/web/email/gmail";

const REDIRECT_URI = "http://localhost:32456/gmail-callback";

async function main() {
  const clientId = process.env.GMAIL_CLIENT_ID || "";
  const clientSecret = process.env.GMAIL_CLIENT_SECRET || "";

  if (!clientId || !clientSecret) {
    console.log(`
============================================================
 SETUP GMAIL API — Trinnity Viseron System
============================================================

Falta configuração OAuth. Passos:

1. Cria um projeto em https://console.cloud.google.com/apis/credentials
2. Ativa "Gmail API" em APIs & Services
3. Cria uma credencial "OAuth Client ID" tipo "Web application"
   - Authorized redirect URI: ${REDIRECT_URI}
4. Coloca no .env:
   GMAIL_CLIENT_ID=<client_id>
   GMAIL_CLIENT_SECRET=<client_secret>
   GMAIL_USER=<a tua conta gmail>
5. Volta a correr: npm run gmail:setup
`);
    process.exit(1);
  }

  const url = gmailAuthUrl(REDIRECT_URI);
  console.log(`
============================================================
 GMAIL API — AUTORIZAÇÃO
============================================================
Abre esta URL num browser e autoriza com a conta do Pedro:

${url}

Depois de autorizares, serás redirecionado para ${REDIRECT_URI}?code=XXXX.
Copia o valor de 'code' e corre:

npm run gmail:setup -- --code=XXXX
`);
  process.exit(0);
}

async function exchange(code: string) {
  try {
    const refreshToken = await gmailExchangeCode(code, REDIRECT_URI);
    console.log(`
============================================================
 SUCESSO! Adiciona ao .env:
============================================================

GMAIL_REFRESH_TOKEN=${refreshToken}

Depois reinicia o servidor. O transporte de email passa a "gmail"
se definires EMAIL_PROVIDER=gmail.

Para testar: npm run demo:email
`);
  } catch (e: any) {
    console.error("Falha ao trocar o code:", e.response?.data || e.message);
    process.exit(1);
  }
}

const codeArg = process.argv.find((a) => a.startsWith("--code="));
if (codeArg) {
  exchange(codeArg.slice(7).trim());
} else {
  main();
}
