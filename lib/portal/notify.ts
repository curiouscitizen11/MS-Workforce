import { newId } from "@/lib/portal/id"
import type { Store } from "@/lib/portal/store"

export type EmailMessage = { to: string; subject: string; body: string }

export type Notify = {
  sms(to: string, body: string, logBody?: string): Promise<void>
  email(message: EmailMessage): Promise<void>
  whatsapp(to: string, body: string): Promise<void>
}

export function createNotify(store: Store, mode: "mock" | "live", fetchImpl: typeof fetch = fetch): Notify {
  return {
    async sms(to, body, logBody) {
      if (mode === "mock") {
        await store.notifications.save({
          id: newId("ntf"),
          at: new Date().toISOString(),
          channel: "sms",
          to,
          body: logBody || body,
          status: "captured",
        })
        return
      }
      const sid = process.env.TWILIO_ACCOUNT_SID
      const token = process.env.TWILIO_AUTH_TOKEN
      const from = process.env.TWILIO_FROM
      if (!sid || !token || !from) throw new Error("SMS is not set up. Add the Twilio keys.")
      const response = await fetchImpl(
        "https://api.twilio.com/2010-04-01/Accounts/" + sid + "/Messages.json",
        {
          method: "POST",
          headers: {
            Authorization: "Basic " + Buffer.from(sid + ":" + token).toString("base64"),
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({ To: to, From: from, Body: body }).toString(),
        },
      )
      if (!response.ok) throw new Error("The text message could not be sent.")
      await store.notifications.save({
        id: newId("ntf"),
        at: new Date().toISOString(),
        channel: "sms",
        to,
        body: logBody || "Text message sent",
        status: "sent",
      })
    },
    async email(message) {
      if (mode === "mock") {
        await store.notifications.save({
          id: newId("ntf"),
          at: new Date().toISOString(),
          channel: "email",
          to: message.to,
          subject: message.subject,
          body: message.body,
          status: "captured",
        })
        return
      }
      const key = process.env.RESEND_API_KEY
      const from = process.env.EMAIL_FROM
      if (!key || !from) throw new Error("Email is not set up. Add the Resend key and the from address.")
      const response = await fetchImpl("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: message.to, subject: message.subject, text: message.body }),
      })
      if (!response.ok) throw new Error("The email could not be sent.")
      await store.notifications.save({
        id: newId("ntf"),
        at: new Date().toISOString(),
        channel: "email",
        to: message.to,
        subject: message.subject,
        body: message.body,
        status: "sent",
      })
    },
    async whatsapp(to, body) {
      await store.notifications.save({
        id: newId("ntf"),
        at: new Date().toISOString(),
        channel: "whatsapp",
        to,
        body,
        status: "stub",
      })
    },
  }
}
