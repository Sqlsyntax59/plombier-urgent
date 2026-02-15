import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";

// GET /api/artisan/export
// Export RGPD : retourne toutes les données personnelles de l'artisan en JSON
export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const userId = user.id;
  const admin = createAdminClient();

  // Rate limit : 1 export par heure
  const { data: recentExport } = await admin
    .from("data_exports")
    .select("id")
    .eq("user_id", userId)
    .gte("created_at", new Date(Date.now() - 3600_000).toISOString())
    .limit(1);

  if (recentExport && recentExport.length > 0) {
    return NextResponse.json(
      { error: "Export limité à 1 par heure. Réessayez plus tard." },
      { status: 429 }
    );
  }

  // Récupérer toutes les données en parallèle
  const [profileRes, leadsRes, transactionsRes, assignmentsRes, feedbacksRes] =
    await Promise.all([
      admin
        .from("profiles")
        .select("id, first_name, last_name, email, phone, whatsapp_phone, city, address, company_name, trade, description, specializations, siret, insurance_provider, insurance_policy_number, insurance_valid_until, slug, google_business_url, latitude, longitude, intervention_radius_km, availability, credits, cgv_accepted_at, created_at, updated_at")
        .eq("id", userId)
        .single(),
      admin
        .from("leads")
        .select("id, problem_type, description, client_phone, client_email, client_city, status, satisfaction, created_at, updated_at")
        .eq("assigned_artisan_id", userId)
        .order("created_at", { ascending: false }),
      admin
        .from("credit_transactions")
        .select("id, type, amount, balance_after, lead_id, created_at")
        .eq("artisan_id", userId)
        .order("created_at", { ascending: false }),
      admin
        .from("lead_assignments")
        .select("id, lead_id, cascade_order, status, notification_channel, notified_at, responded_at, response_ms, wave_number, created_at")
        .eq("artisan_id", userId)
        .order("created_at", { ascending: false }),
      admin
        .from("client_feedbacks")
        .select("id, lead_id, satisfied, rating, comment, issues, submitted_at, created_at")
        .eq("artisan_id", userId)
        .order("created_at", { ascending: false }),
    ]);

  const exportData = {
    exported_at: new Date().toISOString(),
    user_id: userId,
    email: user.email,
    profile: profileRes.data || null,
    leads: leadsRes.data || [],
    credit_transactions: transactionsRes.data || [],
    lead_assignments: assignmentsRes.data || [],
    client_feedbacks: feedbacksRes.data || [],
  };

  // Log export
  await admin.from("data_exports").insert({ user_id: userId, status: "ready" });

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="export-rgpd-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
