# Bodega Cat Deployment Guide

## 🚀 Quick Start

### 1. Environment Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment variables:**

   ```bash
   cp env.example .env
   ```

   Edit `.env` with your Stripe keys:

   ```env
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
   STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```

### 2. Static Page Generation

The site generates static pages for all products at build time. To test this:

```bash
# Build the site (this will fetch products from Stripe and generate static pages)
npm run build

# Preview the built site
npm run preview
```

**Important:** Make sure you have products in your Stripe account before building, or the product pages won't be generated.

### 3. Cloudflare Authentication Setup

#### Step 1: Enable Cloudflare Access

1. Go to your Cloudflare dashboard
2. Navigate to **Access** → **Applications**
3. Click **Add an application**
4. Choose **Self-hosted**

#### Step 2: Configure the Application

1. **Application name:** `Bodega Cat Admin`
2. **Session duration:** `24 hours`
3. **Application domain:** Your domain (e.g., `yourdomain.com`)
4. **Application type:** Self-hosted

#### Step 3: Set Up Policies

Create a policy to protect admin routes:

1. **Policy name:** `Admin Access`
2. **Action:** `Allow`
3. **Rules:**
   - **Include:** `yourdomain.com/admin/*`
4. **Users:**
   - Add your email address
   - Add any other admin emails

#### Step 4: Configure Identity Providers

1. Go to **Access** → **Identity**
2. Choose your identity provider (Google, GitHub, etc.)
3. Configure the settings for your chosen provider

### 4. Deploy to Cloudflare Pages

#### Option A: Using Wrangler CLI

1. **Install Wrangler:**

   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare:**

   ```bash
   wrangler login
   ```

3. **Set secrets:**

   ```bash
   wrangler secret put STRIPE_SECRET_KEY
   wrangler secret put STRIPE_WEBHOOK_SECRET
   ```

4. **Deploy:**

   ```bash
   npm run build
   wrangler pages deploy dist
   ```

#### Option B: Using Cloudflare Dashboard

1. Go to **Pages** in your Cloudflare dashboard
2. Click **Create a project**
3. Connect your GitHub repository
4. Set build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** `/` (or leave empty)

5. **Environment variables:**
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_WEBHOOK_SECRET`

### 5. Webhook Configuration

Set up Stripe webhooks to trigger rebuilds when products change:

1. Go to your Stripe dashboard
2. Navigate to **Developers** → **Webhooks**
3. Click **Add endpoint**
4. **Endpoint URL:** `https://yourdomain.com/api/stripe-webhook`
5. **Events to send:**
   - `product.created`
   - `product.updated`
   - `product.deleted`
   - `price.created`
   - `price.updated`
   - `price.deleted`

6. Copy the webhook signing secret to your environment variables

### 6. Testing the Setup

#### Test Static Generation

1. Add a product in your Stripe dashboard
2. Rebuild the site: `npm run build`
3. Check that the product page was generated: `dist/shop/your-product-slug/index.html`

#### Test Admin Authentication

1. Try accessing `/admin` without authentication - should redirect to login
2. Log in with your configured identity provider
3. Should now have access to admin panel

#### Test Product Management

1. Go to `/admin/products`
2. Try adding a new product
3. Verify it appears in your Stripe dashboard
4. Rebuild the site to see the new product page

## 🔧 Troubleshooting

### Products Not Generating Static Pages

1. **Check Stripe connection:**

   ```bash
   npm run build
   ```

   Look for any errors in the build output.

2. **Verify products exist:**
   - Check your Stripe dashboard for active products
   - Ensure products have the required metadata

3. **Check environment variables:**
   - Verify `STRIPE_SECRET_KEY` is set correctly
   - Test with a simple API call

### Admin Authentication Not Working

1. **Check Cloudflare Access configuration:**
   - Verify the application is enabled
   - Check that your email is in the allowlist
   - Ensure the path `/admin/*` is protected

2. **Check domain configuration:**
   - Verify your domain is properly configured in Cloudflare
   - Check DNS settings

3. **Test with curl:**

   ```bash
   curl -I https://yourdomain.com/admin
   ```

   Should return a redirect to the login page.

### Build Errors

1. **TypeScript errors:**

   ```bash
   npm run typecheck
   ```

2. **Missing dependencies:**

   ```bash
   npm install
   ```

3. **Environment variables:**
   - Ensure all required variables are set
   - Check for typos in variable names

## 📝 Configuration Options

### Customizing the Site

Edit `src/config/site.ts` to customize:

- Site name and description
- Theme colors
- Product types and variations
- Default settings

### Adding Product Types

1. Edit `src/config/site.ts`
2. Add new product types to `defaultProductTypes`
3. Define variations and options
4. Rebuild the site

### Customizing Themes

1. Edit `src/styles/global.css`
2. Modify CSS variables for colors
3. Update `src/config/site.ts` with new theme configurations

## 🚀 Production Checklist

- [ ] Environment variables configured
- [ ] Cloudflare Access enabled for admin routes
- [ ] Stripe webhooks configured
- [ ] Domain configured in Cloudflare
- [ ] SSL certificate active
- [ ] Products added to Stripe
- [ ] Static pages generated successfully
- [ ] Admin authentication working
- [ ] Product management functional
- [ ] Payment processing tested

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review Cloudflare and Stripe documentation
3. Check the browser console for JavaScript errors
4. Verify all environment variables are set correctly

For additional help, refer to:

- [Astro Documentation](https://docs.astro.build/)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Stripe Documentation](https://stripe.com/docs)
