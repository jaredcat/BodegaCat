# Local Development Guide

This guide will help you set up and test the admin interface locally without needing Cloudflare Access.

> **Monorepo:** Use **pnpm** from the repo root. Put **`.env` in `apps/template/`** (Stripe keys for `astro dev` / `astro build`). The integration source is **`packages/bodegacat`**.

## 🚀 Quick Start

### 1. Environment Setup

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Set up environment variables:**

   ```bash
   cp env.example apps/template/.env
   ```

3. **Edit `.env` with your Stripe keys:**

   ```env
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
   STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   NODE_ENV=development
   ```

### 2. Start Development Server

```bash
pnpm dev
```

The development server will start at `http://localhost:4321`

### 3. Access Admin Interface

Navigate to `http://localhost:4321/admin` in your browser.

**🔓 Development Mode Indicator**: You'll see a yellow "Development Mode" indicator in the top-right corner, confirming that Cloudflare Access authentication has been bypassed.

## 🔧 How It Works

### Authentication Bypass

When running in development mode (`NODE_ENV=development` or `import.meta.env.DEV` is true), the middleware automatically:

1. **Bypasses Cloudflare Access** - No authentication headers required
2. **Creates a mock user** - Sets `dev@localhost` as the authenticated user
3. **Shows development indicator** - Visual confirmation that you're in dev mode

### Production vs Development

- **Development**: No authentication required, mock user created
- **Production**: Full Cloudflare Access authentication required

## 📝 Testing Admin Features

### 1. Dashboard

- Visit `/admin` to see the main dashboard
- View product statistics and quick actions

### 2. Product Management

- Visit `/admin/products` to manage existing products
- Visit `/admin/products/new` to create new products
- Test the product form with your Stripe test data

### 3. API Endpoints

- `/api/admin/products` - List and create products
- `/api/stripe-webhook` - Handle Stripe webhooks

## 🧪 Testing with Stripe

### Test Products

1. Create test products in your Stripe Dashboard
2. Add the required metadata:
   - `bodegacat_active`: `true`
   - `productTypeId`: Product type ID
   - `slug`: URL-friendly name
   - `category`: Product category
   - `brand`: Product brand
   - `tags`: JSON array of tags

### Test Payments

1. Use Stripe test cards for payment testing
2. Common test card: `4242 4242 4242 4242`
3. Any future expiry date and any 3-digit CVC

## 🔍 Troubleshooting

### Admin Pages Not Loading

- Check that `NODE_ENV=development` is set in your `.env`
- Ensure the development server is running (`pnpm dev`)
- Check browser console for any errors

### Stripe Integration Issues

- Verify your Stripe keys are correct
- Ensure you're using test keys, not live keys
- Check that products exist in your Stripe test account

### Build Issues

- Run `pnpm run typecheck` to check for TypeScript errors
- Run `pnpm run lint` to check for linting issues
- Ensure all dependencies are installed

## 🚀 Next Steps

Once you've tested locally:

1. **Deploy to staging** - Test with Cloudflare Access enabled
2. **Set up production** - Configure domain and Cloudflare Access
3. **Add real products** - Create products in Stripe production account

## 📚 Additional Resources

- [Stripe Test Mode Documentation](https://stripe.com/docs/testing)
- [Astro Development Guide](https://docs.astro.build/en/guides/dev-toolbar/)
- [Cloudflare Access (production)](../examples/deploy/cloudflare-pages/README.md#6-admin-routes-and-cloudflare-access-optional)
