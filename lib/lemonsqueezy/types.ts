// Types LemonSqueezy pour Epic 6

export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  priceEur: number;
  priceCents: number;
  variantId: string;
  popular?: boolean;
}

export interface LemonSqueezyCheckoutOptions {
  productId: string;
  variantId: string;
  email?: string;
  name?: string;
  customData?: {
    artisan_id: string;
    pack_name: string;
    credits: number;
  };
}

export interface LemonSqueezyWebhookEvent {
  meta: {
    event_name: string;
    custom_data?: {
      artisan_id?: string;
      pack_name?: string;
      credits?: string;
    };
  };
  data: {
    id: string;
    type: string;
    attributes: {
      order_number: number;
      status: 'paid' | 'refunded' | 'pending' | 'failed';
      total: number;
      currency: string;
      customer_id: number;
      product_id: number;
      variant_id: number;
      created_at: string;
    };
  };
}

export interface CheckoutResponse {
  url: string;
  orderId?: string;
}
