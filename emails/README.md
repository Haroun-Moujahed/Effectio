# Effectio emails (Resend + Supabase)

Auth emails are **triggered by Supabase Auth**. Delivery goes through **Resend SMTP** (bypasses Supabase’s built-in 2 emails/hour limit). Sending domain: **`effectio.space`**.

Inbox From line: **Effectio &lt;noreply@effectio.space&gt;**

| Piece | Value |
| --- | --- |
| Domain | `effectio.space` |
| Sender email | `noreply@effectio.space` |
| Sender name | `Effectio` |
| Subject | `Confirm your Effectio account` |
| Body | [`confirm-signup.html`](./confirm-signup.html) |

---

## Checklist

### 1. Verify `effectio.space` in Resend

1. Open [resend.com](https://resend.com) → **Domains** → **Add Domain**.
2. Enter `effectio.space`.
3. Add the DNS records Resend shows at your registrar.
4. Wait until domain status is **Verified**.
5. Keep an **API key** ready (Dashboard → API Keys).

Do not point Supabase SMTP at `@effectio.space` until Resend shows **Verified**.

### 2. Supabase custom SMTP

| Field | Value |
| --- | --- |
| Enable custom SMTP | **On** |
| Sender email | `noreply@effectio.space` |
| Sender name | `Effectio` |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | your Resend API key |

### 3. Confirm signup template

1. Supabase → **Authentication → Email Templates → Confirm signup**.
2. **Subject:** `Confirm your Effectio account`
3. Paste the **full** contents of [`confirm-signup.html`](./confirm-signup.html).
4. Leave `{{ .ConfirmationURL }}` unchanged.
5. Logo URL is `https://effectio.space/logo.png` (served from `public/logo.png` after deploy).
6. Save.

### 4. URL configuration

| Field | Value |
| --- | --- |
| Site URL | `https://effectio.space` |
| Redirect URLs | `https://effectio.space/**`, `https://www.effectio.space/**`, `https://effectio.vercel.app/**`, `http://localhost:5173/**` |

### 5. Smoke test

Sign up, confirm From is **Effectio &lt;noreply@effectio.space&gt;**, branded template with logo, link works.

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `500` / Error sending confirmation email | Verify domain in Resend; use `noreply@effectio.space` only when Verified |
| Logo missing in email | Deploy so `/logo.png` is public; re-paste template |
| Still 2 emails/hour | Confirm custom SMTP is On and saved |

---

## Optional: site on the domain

Vercel → **Domains** → add `effectio.space`, then add Vercel’s DNS records at your registrar (separate from Resend’s email DNS).
