# VISERON — Activación RCS Live / Ativação RCS Live / Activating RCS Live

**TVS v5.0 · Trinnity Viseron System** — Pedro Costa (Comandante) · Trinnity Hurtado (Rainha)

> Documento trilingue · Trilingual document · Documento trilingüe (ES · PT · EN)
> Estado: la cuenta Twilio tiene credenciales ✓ pero **0 infraestructura de mensajería** (sin Messaging Service, sin RCS Sender, sin números). El onboarding RCS es 100% manual en el console Twilio y requiere aprobación de Google/operadores (4-6 semanas).

---

## Resumen / Resumo / Overview

El TVS ya envía RCS con **fallback SMS/MMS** a través de `src/core/rcs/RcsEngine.ts`. El canal está en modo **mock** porque falta el `TWILIO_RCS_SERVICE_SID` (un Messaging Service con un **RCS Sender aprobado** en su pool). RCS no se envía desde un número de teléfono: se envía desde un **RCS Sender (agente)** que muestra la marca (nombre + logo + color) y es aprobado por Google y los operadores.

O TVS já envia RCS com **fallback SMS/MMS** via `src/core/rcs/RcsEngine.ts`. O canal está em modo **mock** porque falta o `TWILIO_RCS_SERVICE_SID` (um Messaging Service com um **RCS Sender aprovado** no seu pool). O RCS não é enviado a partir de um número de telefone: é enviado a partir de um **RCS Sender (agente)** que mostra a marca (nome + logo + cor) e é aprovado pela Google e pelos operadores.

TVS already sends RCS with **SMS/MMS fallback** through `src/core/rcs/RcsEngine.ts`. The channel is in **mock** mode because `TWILIO_RCS_SERVICE_SID` is missing (a Messaging Service with an **approved RCS Sender** in its pool). RCS is not sent from a phone number: it is sent from an **RCS Sender (agent)** that displays the brand (name + logo + color) and is approved by Google and the carriers.

| Requisito / Requirement | Estado / State | Cómo / How |
|---|---|---|
| Cuenta Twilio de pago / Paid account | ✓ | `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` |
| Número SMS/MMS para fallback | ✗ | Comprar en console (Messaging > Numbers) |
| Messaging Service | ✗ | Crear en console (ver §1) |
| RCS Sender (agente) | ✗ | Crear en console + aprobación Google/operadores (§2) |
| Marca aprobada (Google RCS) | ✗ | Parte del flujo del RCS Sender (§2) |
| Logo TVS | ✓ | `mobile/assets/icon.png` (sirve el TVS en `/api/rcs/logo`) |

---

## 1. Crear el Messaging Service / Criar o Messaging Service / Create the Messaging Service

Console: **Develop → Messaging → Services → Create Messaging Service**.

1. **Messaging Service Name**: `TVS-RCS`
2. **What do you want to use Messaging for**: Conversational / Marketing
3. **Integration**: Webhook
   - **Request URL (Inbound)**: `https://viseron-web.onrender.com/api/rcs/status` (método POST)
   - **Delivery status callback**: `https://viseron-web.onrender.com/api/rcs/status`
4. En **Sender Pool**: añade un número SMS (compra uno si no tienes) para el fallback SMS/MMS.
5. Guarda. Anota el **SID** (formato `MG...`).

---

## 2. Crear y aprobar el RCS Sender / Criar e aprovar o RCS Sender / Create & approve the RCS Sender

Console: **Develop → RCS → Senders → Create RCS Sender**.

| Campo / Field | Valor / Value |
|---|---|
| **Sender Display Name** | `Trinnity Viseron` |
| **Description** | `Superinteligencia autónoma multicanal: información, soluciones y soporte con IA 24/7.` |
| **Logo** | `mobile/assets/icon.png` (logo oficial TVS) |
| **Banner** | opcional — mismo logo |
| **Accent Color** | `#34D399` |
| **Website** | `https://www.trinnityviseronsystem.io` |
| **Status callback URL** | `https://viseron-web.onrender.com/api/rcs/status` |
| **Messaging Service** | `TVS-RCS` (el de §1) |

1. Guarda la configuración.
2. Ve a la pestaña **Compliance registration** → **Submit registration** → flujo de registro de Google (marca, país **España**, casos de uso).
   - El registro **US** es opcional; si no hay tráfico US, se salta.
3. **Aprobación**: los operadores españoles (Movistar, Orange, Vodafone, Yoigo/Digi) revisan el agente. Plazo típico **4-6 semanas**. Mientras tanto puedes enviar RCS de prueba a **test devices** añadidos al Sender.
   - **Coste**: revisión de marca Aegis (~$200), cobrada en la cuenta Twilio.
4. Cuando al menos un operador apruebe, el RCS Sender queda **live** y se puede usar en producción.

---

## 3. Activar en el TVS / Ativar no TVS / Activate in TVS

Tras la aprobación, añade al `.env`:

```
TWILIO_RCS_SERVICE_SID=MG...
# TWILIO_RCS_CONTENT_SID=HX...   (opcional: template rico aprobado en Twilio Content Editor)
RCS_BRAND_NAME="Trinnity Viseron"
```

Luego:
```powershell
npm run rcs:status    # debe mostrar "Modo: live (RCS real ✓)"
npm run rcs:send -- +34600000000 "Hola, soy VISERON..."   # prueba real
npm run rcs:list      # entregas + estado (delivered/read via webhook)
```

El envío en masa usa `data/telecom/campaign.json` (mensajes por segmento, RCS ≤140 chars) sobre `data/telecom/sms.json` (47.4k números).

---

## Checklist go-live / Lista de verificação / Go-live checklist

- [ ] Cuenta Twilio de pago ✓ (ya hecha)
- [ ] Número SMS/MMS comprado y en el Messaging Service
- [ ] Messaging Service `TVS-RCS` creado (§1)
- [ ] RCS Sender "Trinnity Viseron" creado con logo y color (§2)
- [ ] Registro de marca Google enviado
- [ ] Operador (España) aprueba el Sender (4-6 semanas)
- [ ] RCS Sender añadido al Sender Pool del Messaging Service
- [ ] Advanced Opt-Out activado (España: `BAJA`, `STOP`, `CANCELAR` en ES/PT/EN)
- [ ] `TWILIO_RCS_SERVICE_SID` en `.env` + `npm run rcs:status` → live
- [ ] Prueba real + broadcast de la campaña 45k (segmentado, consentimiento RGPD)
