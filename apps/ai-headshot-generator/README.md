# 🚀 AI Headshot Generator — Professional Portrait Studio

> **A beautifully designed, fully-integrated AI headshot studio.** Built with Next.js, this open-source template serves as a complete, self-contained SaaS boilerplate for generating high-quality professional portraits and business headshots for LinkedIn, teams, and personal branding.

## 🌐 Live Manifestation

**[Experience the full glassmorphic, responsive interface here](https://ai-headshot-generator-xi.vercel.app/)**. Sign in with Google to explore the Portrait Studio, My Headshots archive, and Booking Tiers directly from your browser.

---

**AI Headshot Generator** is not just another wrapper — it's a production-ready, highly-optimized AI web application. Out of the box, it seamlessly manages User Authentication, Credits & Billing, Image Persistence, and asynchronous AI generation polling using a sleek Next.js (App Router) architecture. It empowers you to build professional-grade AI portrait workflows with built-in mobile optimization, making it the perfect starting point for your next AI SaaS.

**Why use AI Headshot Generator?**

- **Production-Ready SaaS** — Complete with Google OAuth and Stripe Checkout workflows built-in.
- **Dedicated Portrait Studio** — Specifically tailored UI for multi-image reference generation and professional style selection.
- **Historical Archive** — All creations are securely persisted to a PostgreSQL database for a customized user gallery.
- **Premium Glassmorphic UX** — Dynamic multi-theme support (Indigo, Emerald, Rose, Amber) with high-fidelity micro-animations.
- **Extensible Architecture** — Easily swap out the underlying AI model while maintaining the premium application UI.

![AI Headshot Generator](https://cdn.muapi.ai/outputs/d9c39378f60e48098f6b6ce657dc18b5.png)

## ✨ Core Features

- **Kinetic Portrait Studio** — Generate stunning professional headshots with text prompts. Includes options for advanced `Aspect Ratio` tuning and tiered Resolutions (1K, 2K, 4K) tied directly to a flexible credit cost system.
- **Multi-Image Reference Mode** — Transition smoothly to professional editing. Upload local images or add external URLs to use as visual nodes for complex portrait configurations.
- **Secure My Headshots Archive** — A dedicated history vault for logged-in users. Displays past portrait sessions securely fetched from the database, viewable in a detailed inspector modal with 1-click downloads.
- **Booking Tiers & Billing** — Complete Stripe integration. Start users off with a balance, map generations to credit deductions, and seamlessly route them to an interactive pricing page to book sessions (Starter, Professional, Executive).
- **Beautiful & Dynamic UI** — Built on Tailwind CSS and Framer Motion, ensuring every state transition, loading spinner, and dropdown elegantly guides the user.

---

## ⚡ Deployment: Vercel & Production

Deploying an instance of AI Headshot Generator to the web requires minimal configuration. The architecture is engineered explicitly for **Vercel** serverless environments.

### 🔑 Required Environment Variables

To successfully deploy and run, you must populate the following environment variables in your Vercel project settings:

| Service               | Variable                             | Description & Source                                                                         |
| :-------------------- | :----------------------------------- | :------------------------------------------------------------------------------------------- |
| **Database**          | `DATABASE_URL`                       | PostgreSQL connection string ([Supabase](https://supabase.com) or [Neon](https://neon.tech)) |
|                       | `DIRECT_URL`                         | Direct DB connection for Prisma migrations                                                   |
| **NextAuth / Google** | `NEXTAUTH_SECRET`                    | Secure random string generated via `openssl rand -base64 32`                                 |
|                       | `NEXTAUTH_URL`                       | Your production domain (e.g. `https://my-app.vercel.app`)                                    |
|                       | `GOOGLE_CLIENT_ID`                   | Get from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)           |
|                       | `GOOGLE_CLIENT_SECRET`               | Get from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)           |
| **Stripe Billing**    | `STRIPE_SECRET_KEY`                  | Get from [Stripe Dashboard](https://dashboard.stripe.com/apikeys)                            |
|                       | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Get from [Stripe Dashboard](https://dashboard.stripe.com/apikeys)                            |
|                       | `STRIPE_WEBHOOK_SECRET`              | Webhook secret for resolving credit purchases                                                |
| **AI Generator**      | `HEADSHOT_API_KEY`                   | Create an account and get your API key for your targeted headshot model.                     |

---

## 🛠️ Local Development

Ready to iterate locally? Setup is straightforward.

### Prerequisites

- [Node.js](https://nodejs.org/en/) (v18 or higher)
- A local PostgreSQL instance or a free cloud Database URL.

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/SamurAIGPT/ai-headshot-generator
cd ai-headshot-generator

# 2. Install dependencies
npm install

# 3. Setup Environment
cp .env.example .env
# Open .env and insert your specific keys.

# 4. Initialize Database Schema
npx prisma generate
npx prisma db push

# 5. Start the Development Server
npm run dev
```

The graphical console should now be heavily responsive on `http://localhost:3000`.

---

_AI Headshot Generator: A modular, mobile-ready, production-grade AI portrait workspace built for creators and builders._
