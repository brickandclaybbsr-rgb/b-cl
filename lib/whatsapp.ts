/**
 * Meta WhatsApp Cloud API client.
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
 *
 * Plain text messages only work inside the 24h customer-service window. For a
 * scheduled daily report you'll typically need a pre-approved message template;
 * set WHATSAPP_TEMPLATE_NAME to send via template instead of plain text.
 */

const GRAPH_VERSION = "v21.0";

export interface WhatsAppResult {
  ok: boolean;
  status: number;
  body: unknown;
  error?: string;
}

function config() {
  return {
    token: process.env.WHATSAPP_ACCESS_TOKEN ?? "",
    phoneId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? "",
    template: process.env.WHATSAPP_TEMPLATE_NAME ?? "",
  };
}

export function isWhatsAppConfigured(): boolean {
  const { token, phoneId } = config();
  return Boolean(token && phoneId);
}

/** Send a plain text WhatsApp message (24h session window required). */
export async function sendWhatsAppText(
  to: string,
  message: string,
): Promise<WhatsAppResult> {
  const { token, phoneId } = config();
  if (!token || !phoneId) {
    return { ok: false, status: 0, body: null, error: "WhatsApp is not configured." };
  }

  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${phoneId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: { preview_url: false, body: message },
      }),
    },
  );

  const body = await res.json().catch(() => null);
  return {
    ok: res.ok,
    status: res.status,
    body,
    error: res.ok ? undefined : extractError(body),
  };
}

/**
 * Send via an approved template. The template should have a single body
 * parameter that receives the full report text (a common "utility" template
 * pattern). Adjust `components` to match your approved template.
 */
export async function sendWhatsAppTemplate(
  to: string,
  bodyText: string,
  templateName?: string,
  lang = "en",
): Promise<WhatsAppResult> {
  const { token, phoneId, template } = config();
  const name = templateName || template;
  if (!token || !phoneId || !name) {
    return { ok: false, status: 0, body: null, error: "WhatsApp template is not configured." };
  }

  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${phoneId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name,
          language: { code: lang },
          components: [
            {
              type: "body",
              parameters: [{ type: "text", text: bodyText }],
            },
          ],
        },
      }),
    },
  );

  const body = await res.json().catch(() => null);
  return {
    ok: res.ok,
    status: res.status,
    body,
    error: res.ok ? undefined : extractError(body),
  };
}

/** Sends via template if WHATSAPP_TEMPLATE_NAME is set, else plain text. */
export async function sendReport(
  to: string,
  message: string,
): Promise<WhatsAppResult> {
  return config().template
    ? sendWhatsAppTemplate(to, message)
    : sendWhatsAppText(to, message);
}

function extractError(body: unknown): string {
  if (body && typeof body === "object" && "error" in body) {
    const err = (body as { error?: { message?: string } }).error;
    if (err?.message) return err.message;
  }
  return "WhatsApp API request failed.";
}
