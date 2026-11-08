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
- Automatic SMS or email notifications; the shop sees new orders in the admin portal, which refreshes every 30 seconds.
- Password reset and sign-in rate limiting.
