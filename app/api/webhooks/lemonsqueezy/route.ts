import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyWebhookSignature, getPackByVariantId } from "@/lib/lemonsqueezy/client";
import { LemonSqueezyWebhookEvent } from "@/lib/lemonsqueezy/types";

/**
 * POST /api/webhooks/lemonsqueezy
 *
 * Webhook LemonSqueezy pour traiter les paiements de credits.
 * Events: order_created, order_refunded
 *
 * Headers: X-Signature (HMAC SHA256)
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-signature");
    const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

    // Verifier signature
    if (!signature || !webhookSecret) {
      console.error("Webhook: signature ou secret manquant");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      console.error("Webhook: signature invalide");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    const event: LemonSqueezyWebhookEvent = JSON.parse(rawBody);
    const eventName = event.meta.event_name;

    console.info(`Webhook LemonSqueezy: ${eventName}`, event.data.id);

    // Client Supabase avec service role pour bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (eventName === "order_created") {
      return await handleOrderCreated(supabase, event);
    }

    if (eventName === "order_refunded") {
      return await handleOrderRefunded(supabase, event);
    }

    // Autres events ignores
    return NextResponse.json({ received: true });

  } catch (error) {
    console.error("Erreur webhook LemonSqueezy:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleOrderCreated(
  supabase: any,
  event: LemonSqueezyWebhookEvent
) {
  const { data, meta } = event;
  const attrs = data.attributes;

  // Extraire custom data
  const artisanId = meta.custom_data?.artisan_id;
  const packName = meta.custom_data?.pack_name || "unknown";
  const credits = parseInt(meta.custom_data?.credits || "0", 10);

  if (!artisanId || credits <= 0) {
    console.error("Webhook: artisan_id ou credits manquants", { artisanId, credits });
    return NextResponse.json(
      { error: "Missing custom data" },
      { status: 400 }
    );
  }

  // Verifier si deja traite (idempotent)
  const { data: existing } = await supabase
    .from("credit_purchases")
    .select("id")
    .eq("lemonsqueezy_order_id", String(attrs.order_number))
    .single();

  if (existing) {
    console.info("Webhook: commande deja traitee", attrs.order_number);
    return NextResponse.json({ received: true, already_processed: true });
  }

  // Verifier statut paiement
  if (attrs.status !== "paid") {
    console.info("Webhook: paiement non complete", attrs.status);

    // Creer enregistrement pending
    await supabase.from("credit_purchases").insert({
      artisan_id: artisanId,
      lemonsqueezy_order_id: String(attrs.order_number),
      lemonsqueezy_product_id: String(attrs.product_id),
      lemonsqueezy_variant_id: String(attrs.variant_id),
      lemonsqueezy_customer_id: String(attrs.customer_id),
      pack_name: packName,
      credits_purchased: credits,
      amount_cents: attrs.total,
      currency: attrs.currency,
      status: "pending",
      webhook_event_id: data.id,
      webhook_received_at: new Date().toISOString(),
    });

    return NextResponse.json({ received: true, status: "pending" });
  }

  // Paiement reussi - crediter artisan
  const { error: insertError } = await supabase.from("credit_purchases").insert({
    artisan_id: artisanId,
    lemonsqueezy_order_id: String(attrs.order_number),
    lemonsqueezy_product_id: String(attrs.product_id),
    lemonsqueezy_variant_id: String(attrs.variant_id),
    lemonsqueezy_customer_id: String(attrs.customer_id),
    pack_name: packName,
    credits_purchased: credits,
    amount_cents: attrs.total,
    currency: attrs.currency,
    status: "completed",
    webhook_event_id: data.id,
    webhook_received_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
  });

  if (insertError) {
    console.error("Webhook: erreur insertion credit_purchases", insertError);
    return NextResponse.json(
      { error: "Database error" },
      { status: 500 }
    );
  }

  // Ajouter credits au profil artisan (atomique avec log transaction)
  const { data: rpcResult, error: rpcError } = await supabase.rpc("credit_artisan_simple", {
    p_artisan_id: artisanId,
    p_credits: credits,
    p_metadata: {
      source: "lemonsqueezy",
      order_id: String(attrs.order_number),
      pack_name: packName,
      amount_cents: attrs.total,
      currency: attrs.currency,
    },
  });

  if (rpcError || !rpcResult?.success) {
    console.error("Webhook: erreur ajout credits", rpcError || rpcResult?.error);
    // Marquer l'achat comme failed pour retry manuel
    await supabase
      .from("credit_purchases")
      .update({ status: "failed", metadata: { error: rpcError?.message || rpcResult?.error } })
      .eq("lemonsqueezy_order_id", String(attrs.order_number));

    return NextResponse.json(
      { error: "Credit addition failed", details: rpcError?.message || rpcResult?.error },
      { status: 500 }
    );
  }

  console.info(`Credits ajoutes: ${credits} pour artisan ${artisanId}`);

  return NextResponse.json({
    received: true,
    status: "completed",
    credits_added: credits,
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleOrderRefunded(
  supabase: any,
  event: LemonSqueezyWebhookEvent
) {
  const { data } = event;
  const attrs = data.attributes;

  // Trouver l'achat original
  const { data: purchase } = await supabase
    .from("credit_purchases")
    .select("id, artisan_id, credits_purchased, status")
    .eq("lemonsqueezy_order_id", String(attrs.order_number))
    .single();

  if (!purchase) {
    console.info("Webhook refund: achat non trouve", attrs.order_number);
    return NextResponse.json({ received: true });
  }

  if (purchase.status === "refunded") {
    console.info("Webhook refund: deja rembourse", attrs.order_number);
    return NextResponse.json({ received: true, already_refunded: true });
  }

  // Retirer les credits de maniere atomique avec log
  const { data: refundResult, error: refundError } = await supabase.rpc("refund_artisan_credits", {
    p_artisan_id: purchase.artisan_id,
    p_credits: purchase.credits_purchased,
    p_metadata: {
      source: "lemonsqueezy_refund",
      order_id: String(attrs.order_number),
      original_purchase_id: purchase.id,
    },
  });

  if (refundError) {
    console.error("Webhook refund: erreur retrait credits", refundError);
    return NextResponse.json(
      { error: "Refund credit removal failed" },
      { status: 500 }
    );
  }

  // Marquer comme rembourse
  await supabase
    .from("credit_purchases")
    .update({ status: "refunded" })
    .eq("id", purchase.id);

  console.info(`Refund traite: ${refundResult?.credits_removed} credits retires pour artisan ${purchase.artisan_id}`);

  return NextResponse.json({
    received: true,
    status: "refunded",
    credits_removed: refundResult?.credits_removed ?? purchase.credits_purchased,
    new_balance: refundResult?.new_balance,
  });
}
