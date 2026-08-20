# Effectio emails (Resend + Supabase) — free path

Auth emails are still **triggered by Supabase Auth**. Delivery goes through **Resend SMTP**, which bypasses Supabase’s built-in **2 confirmation emails / hour** limit. You stay on Resend’s free tier.

`https://effectio.vercel.app` is your app URL only. It is **not** a Resend-verifiable domain. Keep it for Supabase Site URL / Redirect URLs.

## Free setup (default)

| Piece | Value |
| --- | --- |
| Cost | $0 |
| From address | `beth.t@example.com` (Resend test sender — no domain required) |
| From display name | `Effectio` |
| Subject | `Confirm your Effectio account` |
| Body | [`confirm-signup.html`](./confirm-signup.html) |
| Confirm email | Stay **enabled** in Supabase |

Inbox will look like: **Effectio &lt;beth.t@example.com&gt;** plus the branded dark Effectio card.

---

## Checklist

### 1. Resend (free)

1. Sign up at [resend.com](https://resend.com).
2. Create an **API key** (Dashboard → API Keys).
3. Skip domain verification for this free path.

### 2. Supabase custom SMTP

Supabase → **Project Settings → Authentication → SMTP Settings** (or **Authentication → SMTP**):

| Field | Value |
| --- | --- |
| Enable custom SMTP | **On** |
| Sender email | `beth.t@example.com` |
| Sender name | `Effectio` |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | your Resend API key |

Save. New auth emails use Resend (not Supabase’s 2/hour built-in mail).

### 3. Confirm signup template

1. Supabase → **Authentication → Email Templates → Confirm signup**.
2. **Subject:** `Confirm your Effectio account`
3. Paste the **full** contents of [`confirm-signup.html`](./confirm-signup.html).
4. Leave `{{ .ConfirmationURL }}` in the CTA `href` unchanged.
5. Save.

### 4. URL configuration

Supabase → **Authentication → URL Configuration**:

| Field | Value |
| --- | --- |
| Site URL | `https://effectio.vercel.app` |
| Redirect URLs | `https://effectio.vercel.app/**` and `http://localhost:5173/**` |

### 5. Smoke test

1. Sign up on the app with an inbox you control.
2. Check that From shows **Effectio**, the body matches the template, and the link confirms the account.
3. Sign up again with a different address within the same hour — the second email should still arrive (Resend path).

---

## Upgrade later (optional, not free)

When you want `Effectio <noreply@yourdomain.com>`:

1. Buy any cheap domain.
2. Add it in Resend and add the DNS records Resend shows.
3. In Supabase SMTP, change **Sender email** to `noreply@yourdomain.com`.
4. Keep **Sender name** as `Effectio` and keep the same HTML template.

---

## Other templates

Reuse the same layout for Magic Link / Reset password later — short copy, blue `#3d9eff` CTA.
