// Vercel Serverless Function — /api/contact
// Receives submissions from every form on the site and emails them via Resend.
// The API key lives only here (server-side), never in the browser.

const RESEND_API_KEY = process.env.RESEND_API_KEY;                              // Vercel → Settings → Environment Variables
const TO_EMAIL       = process.env.LEAD_INBOX || "info@janecekhomes.com";       // where submissions land
const FROM_EMAIL     = "Janecek Homes Website <noreply@send.janecekhomes.com>"; // must be on your verified subdomain

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const data = req.body || {};

    // Honeypot — if a bot fills this hidden field, silently accept and drop.
    if (data._gotcha) return res.status(200).json({ ok: true });

    const email = String(data.email || "").trim();
    if (!email) return res.status(400).json({ error: "Email is required." });

    // Build a display name from whatever fields the form provided.
    const name =
      String(data.name || "").trim() ||
      [data.firstName, data.lastName].filter(Boolean).join(" ").trim() ||
      [data.first, data.last].filter(Boolean).join(" ").trim() ||
      "Website visitor";

    const formName = String(data._form || "Website form").trim();

    const rows = Object.entries(data)
      .filter(([k, v]) => !k.startsWith("_") && String(v).trim() !== "")
      .map(([k, v]) =>
        `<tr>
           <td style="padding:6px 16px 6px 0;font-weight:600;text-transform:capitalize;vertical-align:top">${esc(label(k))}</td>
           <td style="padding:6px 0">${esc(String(v)).replace(/\n/g, "<br>")}</td>
         </tr>`)
      .join("");

    const html = `
      <div style="font-family:system-ui,-apple-system,sans-serif;font-size:15px;color:#111;line-height:1.55">
        <h2 style="margin:0 0 14px;font-size:18px">New inquiry — ${esc(formName)}</h2>
        <table style="border-collapse:collapse">${rows}</table>
        <p style="margin:18px 0 0;color:#666;font-size:13px">Reply to this email to respond directly to ${esc(name)}.</p>
      </div>`;

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [TO_EMAIL],
        reply_to: email,
        subject: `New ${formName} inquiry from ${name}`,
        html,
      }),
    });

    if (!resp.ok) {
      console.error("Resend error:", resp.status, await resp.text());
      return res.status(502).json({ error: "Email failed to send." });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong." });
  }
}

function label(k) {
  return k
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;")
          .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
