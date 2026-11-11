import { afterEach, describe, expect, it, vi } from "vitest";
import { alertStatus, orderAlertText, SAMPLE_ORDER, sendOrderAlerts, templateValue, whatsAppTemplateValues } from "./alerts";

const ALERT_VARS = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "ALERT_EMAIL_TO", "ALERT_EMAIL_FROM", "WHATSAPP_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "ALERT_WHATSAPP_TO", "WHATSAPP_TEMPLATE", "WHATSAPP_TEMPLATE_LANG", "WHATSAPP_API_URL", "WHATSAPP_API_VERSION"];

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const clearAlertEnv = () => ALERT_VARS.forEach(name => vi.stubEnv(name, ""));

describe("templateValue", () => {
  it("removes line breaks and runs of spaces that WhatsApp rejects", () => {
    expect(templateValue("House 5,\nStreet 2\t  Gulberg")).toBe("House 5, Street 2, Gulberg");
    expect(templateValue("a     b")).toBe("a b");
  });
  it("never sends an empty value and cuts long ones", () => {
    expect(templateValue("  ")).toBe("-");
    expect(templateValue("x".repeat(400), 50)).toHaveLength(50);
  });
});

describe("alert content", () => {
  it("puts the order, customer and total in the email and the six template values", () => {
    const text = orderAlertText(SAMPLE_ORDER);
    expect(text).toContain("New order TEST-0000 (Phone call)");
    expect(text).toContain("2 x Chicken Biryani");
    expect(text).toContain("Total: PKR 1,250");
    expect(text).toContain("waiting for a call");
    expect(whatsAppTemplateValues(SAMPLE_ORDER)).toEqual([
      "TEST-0000",
      "Test customer",
      "0300 0000000",
      "This is a test alert from the admin portal, Mall Road",
      "2 x Chicken Biryani, 1 x Chocolate Brownie",
      "PKR 1,250 (Phone call)",
    ]);
  });
});

describe("sendOrderAlerts", () => {
  it("does nothing when no channel is set up", async () => {
    clearAlertEnv();
    expect(alertStatus().email.on).toBe(false);
    expect(alertStatus().whatsapp.on).toBe(false);
    expect(await sendOrderAlerts(SAMPLE_ORDER)).toEqual([]);
  });

  it("sends the approved template to every WhatsApp number and reports failures without throwing", async () => {
    clearAlertEnv();
    vi.stubEnv("WHATSAPP_TOKEN", "token");
    vi.stubEnv("WHATSAPP_PHONE_NUMBER_ID", "12345");
    vi.stubEnv("ALERT_WHATSAPP_TO", "0345 9024745, +92 300 1112223");
    const calls: { url: string; body: any }[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body));
      calls.push({ url, body });
      return body.to === "923001112223"
        ? new Response(JSON.stringify({ error: { message: "Recipient not allowed" } }), { status: 400 })
        : new Response("{}", { status: 200 });
    }));

    expect(alertStatus().whatsapp).toMatchObject({ on: true, to: ["+923459024745", "+923001112223"], template: "new_order_alert" });
    const [result] = await sendOrderAlerts(SAMPLE_ORDER);
    expect(calls.map(call => call.body.to)).toEqual(["923459024745", "923001112223"]);
    expect(calls[0].url).toBe("https://graph.facebook.com/v24.0/12345/messages");
    expect(calls[0].body.template).toMatchObject({ name: "new_order_alert", language: { code: "en" } });
    expect(calls[0].body.template.components[0].parameters).toHaveLength(6);
    expect(result).toEqual({ channel: "whatsapp", ok: false, detail: "+923001112223: Recipient not allowed" });
  });
});
