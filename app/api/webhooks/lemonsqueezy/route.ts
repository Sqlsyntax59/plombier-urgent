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

    console.log(`Webhook LemonSqueezy: ${eventName}`, event.data.id);

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

async function handleOrderCreated(
  supabase: ReturnType<typeof createClient>,
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
    console.log("Webhook: commande deja traitee", attrs.order_number);
    return NextResponse.json({ received: true, already_processed: true });
  }

  // Verifier statut paiement
  if (attrs.status !== "paid") {
    console.log("Webhook: paiement non complete", attrs.status);

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

  // Ajouter credits au profil artisan
  const { error: updateError } = await supabase.rpc("credit_artisan_simple", {
    p_artisan_id: artisanId,
    p_credits: credits,
  });

  // Fallback si RPC n'existe pas
  if (updateError) {
    const { error: directError } = await supabase
      .from("profiles")
      .update({
        credits: supabase.rpc("increment_credits", { amount: credits }),
      })
      .eq("id", artisanId);

    // Dernier fallback: lecture + ecriture
    if (directError) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("credits")
        .eq("id", artisanId)
        .single();

      if (profile) {
        await supabase
          .from("profiles")
          .update({ credits: (profile.credits || 0) + credits })
          .eq("id", artisanId);
      }
    }
  }

  console.log(`Credits ajoutes: ${credits} pour artisan ${artisanId}`);

  return NextResponse.json({
    received: true,
    status: "completed",
    credits_added: credits,
  });
}

async function handleOrderRefunded(
  supabase: ReturnType<typeof createClient>,
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
    console.log("Webhook refund: achat non trouve", attrs.order_number);
    return NextResponse.json({ received: true });
  }

  if (purchase.status === "refunded") {
    console.log("Webhook refund: deja rembourse", attrs.order_number);
    return NextResponse.json({ received: true, already_refunded: true });
  }

  // Marquer comme rembourse
  await supabase
    .from("credit_purchases")
    .update({ status: "refunded" })
    .eq("id", purchase.id);

  // Retirer les credits (si possible)
  const { data: profile } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", purchase.artisan_id)
    .single();

  if (profile) {
    const newCredits = Math.max(0, (profile.credits || 0) - purchase.credits_purchased);
    await supabase
      .from("profiles")
      .update({ credits: newCredits })
      .eq("id", purchase.artisan_id);
  }

  console.log(`Refund traite: ${purchase.credits_purchased} credits retires pour ${purchase.artisan_id}`);

  return NextResponse.json({
    received: true,
    status: "refunded",
    credits_removed: purchase.credits_purchased,
  });
}
