// Client LemonSqueezy pour Epic 6 - Paiement & Credits

import { CreditPack, LemonSqueezyCheckoutOptions, CheckoutResponse } from './types';

// Configuration packs de credits
export const CREDIT_PACKS: CreditPack[] = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 10,
    priceEur: 4.99,
    priceCents: 499,
    variantId: process.env.NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_STARTER || '',
  },
  {
    id: 'pro',
    name: 'Pro',
    credits: 50,
    priceEur: 19.99,
    priceCents: 1999,
    variantId: process.env.NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_PRO || '',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    credits: 200,
    priceEur: 69.99,
    priceCents: 6999,
    variantId: process.env.NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_ENTERPRISE || '',
  },
];

// URL checkout LemonSqueezy
export function getCheckoutUrl(options: LemonSqueezyCheckoutOptions): string {
  const storeId = process.env.NEXT_PUBLIC_LEMONSQUEEZY_STORE_ID;

  if (!storeId) {
    throw new Error('NEXT_PUBLIC_LEMONSQUEEZY_STORE_ID non configure');
  }

  const baseUrl = `https://${storeId}.lemonsqueezy.com/checkout/buy/${options.variantId}`;

  const params = new URLSearchParams();

  if (options.email) {
    params.set('checkout[email]', options.email);
  }

  if (options.name) {
    params.set('checkout[name]', options.name);
  }

  // Custom data pour le webhook
  if (options.customData) {
    params.set('checkout[custom][artisan_id]', options.customData.artisan_id);
    params.set('checkout[custom][pack_name]', options.customData.pack_name);
    params.set('checkout[custom][credits]', String(options.customData.credits));
  }

  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

// Creer une session checkout (server-side avec API)
export async function createCheckoutSession(
  options: LemonSqueezyCheckoutOptions
): Promise<CheckoutResponse> {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;

  if (!apiKey) {
    throw new Error('LEMONSQUEEZY_API_KEY non configure');
  }

  const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
    method: 'POST',
    headers: {
      'Accept': 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: {
            email: options.email,
            name: options.name,
            custom: options.customData,
          },
          product_options: {
            redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/artisan/credits/success`,
          },
        },
        relationships: {
          store: {
            data: {
              type: 'stores',
              id: process.env.LEMONSQUEEZY_STORE_ID,
            },
          },
          variant: {
            data: {
              type: 'variants',
              id: options.variantId,
            },
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`LemonSqueezy API error: ${JSON.stringify(error)}`);
  }

  const data = await response.json();

  return {
    url: data.data.attributes.url,
    orderId: data.data.id,
  };
}

// Verifier signature webhook
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const crypto = require('crypto');

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const expectedSignature = hmac.digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Helper: obtenir pack par ID
export function getPackById(packId: string): CreditPack | undefined {
  return CREDIT_PACKS.find(pack => pack.id === packId);
}

// Helper: obtenir pack par variant ID
export function getPackByVariantId(variantId: string): CreditPack | undefined {
  return CREDIT_PACKS.find(pack => pack.variantId === variantId);
}
