# Platinum Art Jewelry — client quote website, client accounts & CRM

Once deployed, the website does the following.

**For clients**

- They build a piece and see a guide price and a 3D mockup.
- **Send to Annie**:
  - They sign in once with Google.
  - WhatsApp opens with their details, a reference number and a link to their PDF.
  - A **PDF of the guide price and mockup** is emailed to the client *and* to Annie.
- **Photo reading** (optional): the client uploads a photo of a design they like and a vision model fills the form in with its best guess — piece, design, metal, stone, carat, setting — labelled by how confident it was. They correct anything that is wrong.
- **AI preview** (optional): a tab beside the 3D mockup that redraws the piece as a photograph. It is generated *from* the 3D mockup, so it follows the design rather than inventing one, and it is labelled "AI illustration - not the finished piece". Off until a key is set.
- **Quotation (PDF)**: a button on the quote page saves the client a one-page sheet — the labelled drawing of their piece, the full specification, their guide price and what happens next. Nothing internal is on it. Clients without sign-in attach it to their WhatsApp message themselves.
- **My orders** (`/account.html`):
  - Clients follow each stage of their piece and read Annie's updates.
  - They re-open their PDF.
  - They **pay** with an FPS QR code, PayMe or PayPal, then tap "I've paid".

**For Annie**

- **Work order**: every signed-in enquiry emails her the same page headed WORK ORDER, with her ruled notes band and a second page for stone costs, metal, workshop, markup and the price she quotes. The engine's own estimates are printed faintly beside each box as a starting point. The client never receives this version.
- **CRM** (`/admin.html`):
  - Every enquiry arrives as an order, with the client's name, email, phone, quote PDF and work order.
  - She moves orders through stages and sends updates, which are also emailed to the client.
  - She records the confirmed price and keeps private notes.
  - She sends **deposit / balance payment requests** and marks them paid.

**Automatically**

- Metal prices and USD/HKD refresh every day at 12:00 Hong Kong time.
- Photo reading is off by default: it uses Claude, which isn't available in Hong Kong.

Annie's internal quote builder (costs, margins, sources) is **not** in this folder. It stays private on claude.ai.

You can preview both new pages before setting anything up: open `account.html?demo` and `admin.html?demo`. They show sample data, and nothing is saved.

---

## What's inside

| File | What it does |
|---|---|
| `index.html` | The quote page |
| `account.html` | Client portal: orders, updates, PDFs, payments |
| `admin.html` | Annie's CRM (only emails in the `admins` table can use it) |
| `site-config.js` | **Edit this:** WhatsApp number, photo reading, Supabase URL + public key |
| `js/` | Sign-in, PDF builder, send flow, FPS QR |
| `supabase/schema.sql` | Database tables and security rules. Run once in Supabase (safe to re-run after an update) |
| `netlify/functions/update-prices.mjs` | Daily 12:00 HKT price refresh |
| `netlify/functions/market-data.mjs` | Serves today's prices at `/api/market-data` |
| `netlify/functions/read-photo.mjs` | Photo → piece details at `/api/read-photo` |
| `netlify/functions/mockup-image.mjs` | 3D mockup → photographic AI preview at `/api/mockup-image` |
| `netlify/functions/send-quote.mjs` | Saves the PDF, creates the order, emails client + Annie at `/api/send-quote` |
| `netlify/functions/order-update.mjs` | Annie's stage/message updates, emails the client, at `/api/order-update` |
| `netlify/functions/request-payment.mjs` | Creates a payment request with FPS QR, PayMe and PayPal, emails the client, at `/api/request-payment` |
| `netlify/lib/` | Shared code and generated data (don't edit) |

## The services it uses (all have free tiers)

| Service | Used for | Cost to start |
|---|---|---|
| **Netlify** | Hosting, daily price refresh, server functions | Free |
| **Supabase** | Google sign-in, database (clients, orders, invoices), private PDF storage | Free |
| **Google Cloud** | The "Continue with Google" button (OAuth client) | Free |
| **Gmail** (or **Resend** once you have a domain) | Sending the emails with the PDF attached | Free |
| **Anthropic** (optional) | Photo reading | Pay per use, about a cent a photo |
| **Alibaba Cloud Model Studio** *or* **OpenRouter** (optional) | The AI preview image | Pay per image, about 3-8 US cents |

---

## Setup (about an hour, once)

### 1. Put the site on Netlify

> **Don't drag this folder onto Netlify.** A dropped folder is published as-is with no build step, so `npm install` never runs and none of the seven functions in `netlify/functions` deploy. The estimator, the stone dial, the 3D mockup and all three PDFs still work, because those run in the browser — but sign-in, the emailed quote, the work order to Annie, the CRM, payment requests, the daily price refresh and the AI preview are all functions, and all of them will be missing. Netlify only builds when it pulls from Git.

1. Create a GitHub repository (e.g. `platinum-art-quote`; private is fine).
2. Upload **everything in this folder**, keeping the folders — `index.html`, `admin.html`, `account.html`, `site-config.js`, `netlify.toml`, `package.json`, `README.md`, and the `js`, `netlify` and `supabase` folders. Upload the *contents*, not the folder itself: `netlify.toml` has to sit at the top level of the repository.
3. At netlify.com, go to **Add new project → Import an existing project → GitHub**, pick the repository and click **Deploy**. `netlify.toml` already holds the settings, so leave the build command empty.
   - Already have a site from a dropped folder and want to keep its address? Instead go to **Project configuration → Developer settings → Continuous deployment → Repository** and choose **Link repository**.
4. Note the address, e.g. `https://platinum-art-quote.netlify.app`. You can add your own domain later under **Domain management**. If you do, use the new address everywhere below.
5. Check it worked: **Project configuration → Functions** should list all seven — `market-data`, `mockup-image`, `order-update`, `read-photo`, `request-payment`, `send-quote`, `update-prices`. They'll return errors until step 6; that's expected. If the list is empty, the repository layout is wrong — see step 2.

At this point the quote page works with the plain WhatsApp button. The rest adds sign-in, PDFs, the CRM and payments.

### 2. Create the Supabase project (database + login)

1. At supabase.com, click **New project**. Choose region **Singapore** (closest to Hong Kong) and save the database password somewhere safe.
2. **Set up the database:**
   - Open `supabase/schema.sql` in a text editor.
   - On the line `insert into public.admins (email) values ('annie@example.com')`, replace the example with **Annie's Google email**.
   - In Supabase, go to **SQL Editor → New query**, paste the whole file and click **Run**.
3. **Copy your keys.** Go to **Project Settings → API** and note:
   - **Project URL** (e.g. `https://abcdefgh.supabase.co`)
   - **anon public** key, which is safe for the web page
   - **service_role** key, which is **secret**. It only goes into Netlify, never into a file.
4. **Set the addresses.** Go to **Authentication → URL Configuration**:
   - **Site URL:** your site address
   - **Redirect URLs:** add `https://YOUR-SITE/` , `https://YOUR-SITE/account.html` and `https://YOUR-SITE/admin.html`

### 3. Turn on "Continue with Google"

1. Go to console.cloud.google.com and create a project (e.g. "Platinum Art Jewelry").
2. Go to **APIs & Services → OAuth consent screen**:
   - User type **External**, app name "Platinum Art Jewelry", your support email.
   - **Authorised domains:** your site address without `https://` (e.g. `platinum-art-quote.netlify.app`) and your Supabase project address (e.g. `abcdefgh.supabase.co`).
   - **Publish** the app, so any Google user can sign in.
3. Go to **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Type: **Web application**
   - **Authorised JavaScript origins:** your site address
   - **Authorised redirect URIs:** `https://abcdefgh.supabase.co/auth/v1/callback` (your Supabase URL + `/auth/v1/callback`)
4. Copy the **Client ID** and **Client secret**.
5. In Supabase, go to **Authentication → Sign In / Providers → Google**, turn it on and paste the ID and secret.

### 4. Set up email

**No domain yet? Use Annie's Gmail (recommended to start).** Emails go out from her Gmail address, and client replies land in her inbox.

1. Sign in to the Gmail account → myaccount.google.com → **Security** → turn on **2-Step Verification**.
2. Go to myaccount.google.com/apppasswords → name it "Platinum Art website" → **Create**. Copy the 16-letter password.
3. You'll use these as `SMTP_USER` (the Gmail address) and `SMTP_PASS` (the app password) in step 6.

Gmail allows about 500 emails a day, which is plenty. If Annie ever changes her Google password, create a new app password.

**Later, with your own domain (e.g. platinumartjewelry.com): Resend.** Emails come from quotes@yourdomain.
1. Sign up at resend.com → **Domains → Add domain**, add the DNS records it shows at your registrar, wait for **Verified**.
2. **API Keys → Create** and copy the key into `RESEND_API_KEY`, set `MAIL_FROM`, and remove `SMTP_USER` / `SMTP_PASS` (Gmail is used whenever those are set).

### 5. Payment details

- **FPS:** use Annie's FPS ID, or the mobile number or email registered for FPS. The site builds a standard HKMA FPS QR code for each payment request, with the amount and invoice reference filled in.
- **PayPal:** your PayPal.me name (paypal.me → create your link). Links are built as `paypal.me/NAME/AMOUNTHKD`. PayPal charges fees on received payments.
- **HSBC PayMe:** PayMe doesn't offer a link with the amount filled in. Choose one of these:
  - Put your **PayMe for Business payment link or PayCode link** in `PAYME_LINK`. It's shown on every request, and the client types the amount.
  - Or, when sending a request in the CRM, paste a link made for that exact amount in the PayMe for Business app.

### 6. Add the settings to Netlify

**Site configuration → Environment variables → Add a variable**, one per row:

| Variable | Value |
|---|---|
| `SUPABASE_URL` | Supabase Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase **service_role** key (secret) |
| `SMTP_USER` | Annie's Gmail address (Gmail option) |
| `SMTP_PASS` | The Google app password (Gmail option) |
| `RESEND_API_KEY` | Resend API key (domain option, instead of SMTP) |
| `MAIL_FROM` | Domain option only, e.g. `Platinum Art Jewelry <quotes@platinumartjewelry.com>` |
| `ANNIE_EMAIL` | Where new-enquiry emails go, e.g. Annie's email |
| `SITE_URL` | Your site address, no trailing slash |
| `FPS_ID` **or** `FPS_MOBILE` **or** `FPS_EMAIL` | e.g. `FPS_MOBILE` = `+852-91234567` (keep this format) |
| `FPS_NAME` | Name shown in the payer's banking app, e.g. `Platinum Art Jewelry` |
| `PAYPAL_ME` | Your PayPal.me name, e.g. `platinumartjewelry` (leave out to hide PayPal) |
| `PAYME_LINK` | Optional default PayMe link |
| `ANTHROPIC_API_KEY` | Optional, photo reading — only if you have one; the Anthropic API does not serve Hong Kong, and `QWEN_API_KEY` does the same job |
| `ANTHROPIC_MODEL` | Optional; a current Claude model that reads images (defaults to `claude-sonnet-4-5`) |
| `QWEN_API_KEY` | Optional, AI preview — Alibaba Cloud Model Studio key (**Singapore** region) |
| `QWEN_ENDPOINT` | Optional; defaults to `https://dashscope-intl.aliyuncs.com` |
| `QWEN_IMAGE_MODEL` | Optional; defaults to `qwen-image-edit` |
| `QWEN_VISION_MODEL` | Optional; defaults to `qwen-vl-max` (photo reading) |
| `OPENROUTER_API_KEY` | Optional, AI preview — used only if `QWEN_API_KEY` is not set |
| `OPENROUTER_IMAGE_MODEL` | Optional; defaults to `bytedance/seedream-4-5` |
| `OPENROUTER_VISION_MODEL` | Optional; defaults to `qwen/qwen2.5-vl-72b-instruct` (photo reading) |
| `AI_IMAGE_DAILY_CAP` | Optional; images per day before the preview politely declines (default 50) |

### 6b. The AI preview (optional)

A picture of the finished piece helps a client decide, but it must not contradict the quote. The function sends the client's own 3D mockup to the image model and asks it to re-render *that* — never to design from a text description, which in testing invented a halo, changed the side stones and put the ring on the wrong finger.

Pick one provider:

- **Alibaba Cloud Model Studio (recommended)** — `qwen-image-edit` is built for editing an image you supply. Sign up at alibabacloud.com, open **Model Studio**, switch the console to the **Singapore** region (Singapore and Beijing keys are not interchangeable), create an API key and put it in `QWEN_API_KEY`. Open to Hong Kong businesses. About US$0.03 an image.
- **OpenRouter** — one key for ByteDance Seedream, Google Nano Banana and OpenAI GPT Image. Put it in `OPENROUTER_API_KEY` and optionally set `OPENROUTER_IMAGE_MODEL`. Seedream is about US$0.035-0.04 a flat rate per image. Note that some Hong Kong users report OpenRouter blocking the Google and OpenAI models by billing address; Seedream is not affected.

**One key switches on two features.** The same `QWEN_API_KEY` (or `OPENROUTER_API_KEY`) also powers **photo reading**: a client uploads a photo of a design they like and the form fills itself in with a best guess, which they then correct. Nothing else to set — the page asks `/api/capabilities` what this deployment has keys for, so both features appear on their own as soon as the key is saved and the site redeploys. The `photoReading` and `aiPreview` flags in `site-config.js` are only a fallback for deploys without that endpoint. Costs stay small on their own: every picture is cached against the exact specification, so one design is one image however many times it is viewed, and `AI_IMAGE_DAILY_CAP` stops a strange day becoming a bill.

**Before you turn it on for clients**, generate half a dozen across different designs and check the piece is right. The preview never goes on the work order or the quote PDF, and it is always labelled as an illustration.

### 7. Edit `site-config.js`

```js
window.PA_CONFIG = {
  whatsappNumber: "85291234567",                    // Annie's WhatsApp, digits only
  photoReading: false,                              // photo reading uses Claude, which isn't available in Hong Kong
  aiPreview: false,                                 // true once QWEN_API_KEY or OPENROUTER_API_KEY is set
  supabaseUrl: "https://abcdefgh.supabase.co",
  supabaseAnonKey: "eyJ...the anon public key...",  // NOT the service_role key
};
```

Upload the changed file to GitHub. Netlify redeploys within a minute.

### 8. Test it end to end

1. **Refresh the prices.** In Netlify, go to **Logs → Functions → update-prices → Run now**. After that it runs daily at 12:00 HKT on its own.
2. **Send a test quote.**
   - On the quote page, click **Send to Annie** → **Continue with Google** with a personal account → **Send to Annie**.
   - WhatsApp should open with a reference and PDF link.
   - Both inboxes should get the PDF.
3. **Update the order.**
   - Open `/admin.html` and sign in with Annie's Google account.
   - The test order should be there.
   - Move it to "Quote confirmed" with a price. The client email should arrive.
4. **Request a payment.**
   - Request a HK$1 deposit.
   - On the client account, open `/account.html` and scan the FPS QR with a banking app. Check that the name and amount are right, and **don't pay**.
   - Tap "I've paid". In the CRM, the order shows **Check payment**. Tap **Confirm received**.

To add another admin later, open Supabase **Table Editor → admins** and insert their Google email.

---

## How it works (and limits worth knowing)

- **Why WhatsApp gets a link, not the PDF:** WhatsApp's click-to-chat links can only carry text, so no website can attach a file through them. The message includes a private link to the PDF (valid 30 days), and the email to both of you carries the actual PDF.
- **Privacy:**
  - Clients only ever see their own orders; the database enforces this with row-level security.
  - PDFs are in a private storage bucket.
  - The service_role key only lives in Netlify's server functions.
  - Add a short privacy note to your website saying you store name, email, phone and quote details to handle orders.
- **Payments:**
  - The site creates payment requests and QR codes, but **it does not see money arrive**. FPS and PayMe have no public notification service for small merchants.
  - Annie confirms each payment in the CRM, after the client taps "I've paid" or when she sees it in her bank.
- **Without Supabase configured:**
  - The quote page falls back to the plain WhatsApp button.
  - `account.html` and `admin.html` show demo data.

## How prices stay current

- **Gold, platinum, silver:** from [Gold API](https://gold-api.com) (free), daily at 12:00 HKT.
- **USD/HKD:** from [ExchangeRate-API](https://www.exchangerate-api.com) (free; the attribution link is in the page footer).
- **Safety checks:**
  - If a metal jumps more than 8% in a day, the site keeps yesterday's price and records a flag (see `/api/market-data`).
  - If a source is down, the previous price is kept.
- **Gemstones:** benchmarks are in `netlify/lib/market-data-seed.mjs`. Diamond and coloured-stone rates live in the pricing engine inside `index.html`.
  - When Annie's supplier prices show the card is off, ask Claude to update the rate card and rebuild this folder.

The claude.ai versions (Annie's builder and the private client link) keep their own noon refresh through the scheduled task in Claude.

## Updating the website later

Whenever the pricing engine changes (new designs, metals, settings, stones), Claude rebuilds this folder. Replace the files in GitHub, but **keep your own `site-config.js`**. Netlify publishes within a minute.
