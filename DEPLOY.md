# Deploying to Cloudflare Pages

Walkthrough for the first deploy + how to wire up the Function. All times are
ballpark for one operator who's never done this before.

> **Prerequisite:** the DNS records for `suncoastpoolpros.com` are live in
> Cloudflare (nameservers switched at SiteGround, zone shows "Active"). The
> Pages deploy itself works before DNS, but you can't attach the custom
> domain until DNS is on Cloudflare.

---

## 1. Create the Pages project (5 min)

1. **dash.cloudflare.com** → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
2. Authorize Cloudflare to read your GitHub. Pick the **`suncoastpoolpros/website`** repo.
3. Branch: `main`. Production branch: `main`.
4. Build settings:
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** `/` (leave blank)
   - **Node version:** 20 (auto-detected, fine)
5. **Save and Deploy.** First build takes ~2 min.

You'll get a temporary URL like `suncoast-landing-abc.pages.dev` — that works immediately. Test the homepage there before going live.

---

## 2. Set environment variables (5 min)

In your new Pages project → **Settings** → **Environment Variables** → **Add variable**.

Add each as **Production**. (You can copy them to Preview too — useful for testing the form on preview deploys without spamming yourself.)

| Variable | Type | Value |
|----------|------|-------|
| `RESEND_API_KEY` | Secret | `re_xxxxx` (the key you saved earlier) |
| `CONTACT_TO_EMAIL` | Plaintext | `service@suncoastpoolpros.com` |
| `CONTACT_FROM_EMAIL` | Plaintext | `noreply@suncoastpoolpros.com` |
| `TURNSTILE_SECRET_KEY` | Secret | (from Turnstile setup below — blank for now) |
| `VITE_TURNSTILE_SITE_KEY` | Plaintext | (from Turnstile setup below — blank for now) |
| `ALLOWED_ORIGINS` | Plaintext | `https://suncoastpoolpros.com,https://www.suncoastpoolpros.com` |

**Important**: Mark `RESEND_API_KEY` and `TURNSTILE_SECRET_KEY` as **Secret** type. Cloudflare encrypts those and never shows them again after save.

After saving, **redeploy** so the Function picks them up (Settings → Deployments → click the three-dot menu on the latest → Retry deployment).

---

## 3. Set up Turnstile (10 min)

1. **dash.cloudflare.com** → **Turnstile** (left sidebar) → **Add Site**.
2. Site name: `suncoastpoolpros.com`
3. Hostnames: add **`suncoastpoolpros.com`** AND **`www.suncoastpoolpros.com`** AND your `*.pages.dev` preview hostname (so preview deploys work too).
4. Widget mode: **Invisible**
5. Save.

Cloudflare gives you a **Site Key** (public, looks like `0x4AAAA...`) and a **Secret Key** (private). Copy both.

Back in Pages → Environment Variables, update:
- `VITE_TURNSTILE_SITE_KEY` = the Site Key
- `TURNSTILE_SECRET_KEY` = the Secret Key

Redeploy.

---

## 4. Attach your domain (5 min, after DNS is live)

In your Pages project → **Custom domains** → **Set up a domain**.

1. Add `suncoastpoolpros.com`. Cloudflare auto-creates the CNAME (since DNS is on Cloudflare).
2. Add `www.suncoastpoolpros.com` too (it'll redirect to the apex automatically).
3. Wait 1-2 minutes for SSL to provision.

Done — your site is live at the real domain.

---

## 5. Verify everything works

Quick smoke test from your phone (so you hit the production deploy fresh, not cached):

- [ ] Homepage loads at `suncoastpoolpros.com`
- [ ] Click "Get a Quote" → popup opens
- [ ] Submit the form with a real test
- [ ] Check `service@suncoastpoolpros.com` (or your Gmail if you set up forwarding) — submission should arrive within ~5 seconds
- [ ] Try a deep link like `suncoastpoolpros.com/belleair-beach-fl` — should load directly (not 404)
- [ ] Try a bogus URL like `suncoastpoolpros.com/blah` — should show the 404 page
- [ ] Open DevTools → Network on a quote submit → confirm `/api/contact` returns `{ ok: true }`

---

## Troubleshooting

### Form submits but no email arrives
- Check the Pages Function logs: project → **Functions** → **Real-time logs**, then submit a test form. Look for a `delivery_failed` line.
- Most likely cause: `RESEND_API_KEY` is missing or wrong. Re-paste it, redeploy.
- Second most likely: Resend domain not verified yet (or DKIM not propagated). Check Resend dashboard → Domains.

### Form submits but returns `captcha_failed`
- Means `TURNSTILE_SECRET_KEY` is set but the widget isn't working. Check that `VITE_TURNSTILE_SITE_KEY` matches the site you created.
- During the development window, leave both Turnstile vars blank and the Function will accept un-tokened submissions.

### Form returns `forbidden`
- The request's Origin doesn't match `ALLOWED_ORIGINS`. Add your apex + www domain (and any preview URLs you want to allow).

### Deep links 404 (e.g. `/belleair-beach-fl` works clicking but not refreshing)
- The `public/_redirects` file isn't being deployed. Confirm it exists in `public/_redirects` and that your build copies the `public/` directory to `dist/`.

---

## Maintenance notes

- **Adding/changing form fields:** edit `src/components/QuoteChooser.tsx` or `QuoteForm.tsx`. The Function automatically includes any new field in the email (it iterates over the JSON payload).
- **Rotating the Resend API key:** create a new one in Resend, update `RESEND_API_KEY` in Pages, redeploy, revoke the old one.
- **Changing the destination email:** update `CONTACT_TO_EMAIL` env var, redeploy. (No code change.)
- **Adding a Google Sheets backup log:** add a second `fetch()` call in `functions/api/contact.ts` after the Resend send, posting to a Google Apps Script webhook. Wrap in try/catch so a sheet failure doesn't fail the email.
