# Living Foods

Online shop for Living Foods, 7/83 Shahrah-e-Quaid-e-Azam, Mall Road, Lahore.
Dairy, frozen foods, ready-made meals and desserts, ordered on WhatsApp or by phone, paid on delivery.

Stack: React 19 + Vite, Express + tRPC, MySQL (Drizzle ORM). Same setup as the Living Art shop, so it deploys on Coolify the same way.

## What it does

- **Storefront** in a Mughal and truck-art style: products are painted panels on the side of a truck, photos are cut to a Mughal arch.
- **Checkout without an account.** Customers fill a bag, choose a packing option, enter name, phone, area and address, then either:
  - **Order on WhatsApp**: the order is saved and WhatsApp opens with the full order typed out, sent to the shop's WhatsApp number; or
  - **Place order, we'll call you**: the order is saved and the shop calls the customer to confirm.
- **Optional accounts**: signed-in customers see their past orders.
- **Admin portal** at `/admin`:
  - Orders: new orders, status (new, confirmed, preparing, out for delivery, delivered, cancelled), one-tap call or WhatsApp to the customer.
  - Products: name, category, price, unit, description, product photo, packing photo, ingredients, allergens, dietary labels, calories and serving, health information, expiry date, shelf life and storage, show or hide, feature on home page.
  - Categories: add, rename, reorder, hide, delete (only when empty).
  - Packing options: name, charge, photo, which categories it is recommended for, default.
  - Shop details: phone, WhatsApp number that receives orders, address, opening hours, delivery charge and free-delivery threshold.
- **Order alerts** (see below): a chime, desktop notification and tab count in the admin portal, plus an email and a WhatsApp message to the shop for every new order.

## Placeholders to replace before going live

| What | Where to change it |
| --- | --- |
| Product prices (Biryani 650, Bun Kebab 250, Chicken Burger 450, Banana Cake 900, Chocolate Brownie 250) | Admin portal, Products |
| Ingredients, calories, allergens, shelf life (left empty on purpose) | Admin portal, Products |
| Product and packing photos | Admin portal, Products |
| Insulated bag charge (PKR 100) | Admin portal, Packing |
| Phone and WhatsApp number (0345 9024745, taken from livingfoodspk.com) | Admin portal, Shop details |
| Opening hours, delivery charge | Admin portal, Shop details |
| Logo | Now the Kitchen & Marketplace logo: `client/public/logo.png` (mark, header), `logo-full.png` (footer) and `favicon.png`. Replace those files to change it. |

## Order alerts

Three ways the shop hears about a new order:

1. **Admin portal.** Click **Turn on alerts** once on `/admin`. While the page is open (any tab, even in the background) a new order plays a chime, shows a desktop notification and puts the count in the browser tab title. The order list checks every 15 seconds. After reopening the page, click anywhere once so the browser allows sound.
2. **Email.** Sent the moment an order is placed, whether or not anyone is on the admin portal.
3. **WhatsApp.** A message to one or more shop numbers, sent the same way.

Email and WhatsApp are switched on with environment variables (in Coolify: the app, **Environment Variables**, then redeploy). Admin portal, **Shop details**, **Order alerts** shows which are on and has a **Send test alert** button. A failed alert is written to the app log and never stops the customer's order.

### Email

| Variable | Example |
| --- | --- |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `465` (or `587`) |
| `SMTP_USER` | the sending Gmail address |
| `SMTP_PASS` | a Gmail **App Password** (Google Account, Security, 2-Step Verification on, App passwords) |
| `ALERT_EMAIL_TO` | who receives alerts, comma separated |
| `ALERT_EMAIL_FROM` | optional, e.g. `Living Foods <you@gmail.com>` |

Any SMTP service works the same way (Zoho, Brevo, Resend, your host's mailbox).

### WhatsApp (Meta WhatsApp Cloud API)

WhatsApp only lets a business send a message first through an approved template, so this needs a one-time setup:

1. At [developers.facebook.com](https://developers.facebook.com) create an app of type **Business** and add **WhatsApp**. Link or create a Meta Business account.
2. Add a phone number to send from. It must not already be in use on the WhatsApp or WhatsApp Business app (a new SIM is simplest). Meta also gives a free test number for trying it out.
3. In **WhatsApp Manager, Message templates**, create a template:
   - Name: `new_order_alert`, category **Utility**, language **English**.
   - Body (six variables, in this order):
     ```
     New order {{1}} at Living Foods.
     Customer: {{2}}, {{3}}
     Address: {{4}}
     Items: {{5}}
     Total: {{6}}
     Please open the admin portal to confirm.
     ```
   - Fill in the sample values Meta asks for (any realistic order), submit, and wait for approval (usually minutes to a day).
4. Create a permanent token: **Business settings, System users**, add a system user, give it the WhatsApp app and account, generate a token with `whatsapp_business_messaging` permission.
5. Set the variables:

| Variable | Value |
| --- | --- |
| `WHATSAPP_TOKEN` | the system user token |
| `WHATSAPP_PHONE_NUMBER_ID` | the **Phone number ID** (not the phone number) from the WhatsApp **API Setup** page |
| `ALERT_WHATSAPP_TO` | shop numbers that receive alerts, comma separated, e.g. `0345 9024745` |
| `WHATSAPP_TEMPLATE` | optional, default `new_order_alert` |
| `WHATSAPP_TEMPLATE_LANG` | optional, default `en` (must match the template language code) |
| `WHATSAPP_API_VERSION` | optional, default `v24.0` |

While the Meta app is in development mode, each receiving number must be added under **API Setup, To** first. Meta charges per template message; see Meta's WhatsApp pricing page for the current rate for Pakistan.

## Run it on your computer

Needs Node 22, pnpm 10 and Docker.

```powershell
copy .env.example .env          # then edit JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
pnpm install
docker compose up -d --wait     # MySQL on port 8081
pnpm db:setup                   # creates tables, starter menu and the admin account
pnpm dev                        # http://localhost:3000
```

Sign in at `/sign-in` with the admin email and password, then open `/admin`.

### Demo menu (made-up products)

To see the shop full of products while you wait for the real menu:

```powershell
pnpm db:demo                 # adds 18 made-up products with drawings, and fills in the 5 starter products
pnpm db:demo -- --remove     # takes the demo products and drawings out again
```

Every demo name, price, ingredient list and calorie figure is invented. The pictures are illustrations drawn for this project (`server/demo-images`, made by `draw.py` there), not photos of real food. Remove the demo menu, or replace each product in the admin portal, before going live.

## Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Run locally with live reload |
| `pnpm build` / `pnpm start` | Production build and start |
| `pnpm db:setup` | Apply database changes and add starter data (safe to re-run; never overwrites admin edits) |
| `pnpm db:demo` | Add the made-up demo menu; `pnpm db:demo -- --remove` takes it out |
| `pnpm db:generate` | Create a migration after changing `drizzle/schema.ts` |
| `pnpm check` / `pnpm test` | Type-check / unit tests |

## Deploy on Coolify

Same as Living Art: a MySQL database resource, then the app from this repository with the Dockerfile build pack, port 3000, environment variables `DATABASE_URL`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and persistent storage mounted at `/app/uploads` (product photos live there). Run `pnpm db:setup` once in the app's terminal, or set it as the post-deployment command.

## Not built yet

- Online card payment (orders are cash on delivery).
- Password reset and sign-in rate limiting.
