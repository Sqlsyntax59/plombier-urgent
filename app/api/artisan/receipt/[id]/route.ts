import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface PurchaseWithArtisan {
  id: string;
  pack_name: string;
  credits_purchased: number;
  amount_cents: number;
  currency: string;
  created_at: string;
  completed_at: string | null;
  lemonsqueezy_order_id: string;
  artisan_id: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    company_name: string | null;
    email: string | null;
    siret: string | null;
    address: string | null;
    city: string | null;
    postal_code: string | null;
  } | null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // Vérifier l'authentification
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Récupérer l'achat avec les infos de l'artisan
  const { data: purchase, error } = await supabase
    .from("credit_purchases")
    .select(`
      id,
      pack_name,
      credits_purchased,
      amount_cents,
      currency,
      created_at,
      completed_at,
      lemonsqueezy_order_id,
      artisan_id,
      profiles (
        first_name,
        last_name,
        company_name,
        email,
        siret,
        address,
        city,
        postal_code
      )
    `)
    .eq("id", id)
    .eq("artisan_id", user.id)
    .eq("status", "completed")
    .single() as { data: PurchaseWithArtisan | null; error: Error | null };

  if (error || !purchase) {
    return NextResponse.json({ error: "Achat non trouvé" }, { status: 404 });
  }

  const profile = purchase.profiles;
  const artisanName = profile?.company_name
    || `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim()
    || "Artisan";

  const artisanAddress = [
    profile?.address,
    `${profile?.postal_code || ""} ${profile?.city || ""}`.trim(),
  ].filter(Boolean).join("<br>");

  const purchaseDate = new Date(purchase.completed_at || purchase.created_at);
  const formattedDate = purchaseDate.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const formattedTime = purchaseDate.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const amountHT = (purchase.amount_cents / 100 / 1.2).toFixed(2);
  const amountTVA = ((purchase.amount_cents / 100) - parseFloat(amountHT)).toFixed(2);
  const amountTTC = (purchase.amount_cents / 100).toFixed(2);

  // Générer le HTML du reçu
  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reçu #${purchase.lemonsqueezy_order_id}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      padding: 40px;
      color: #1e293b;
    }
    .receipt {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
      color: white;
      padding: 32px;
      text-align: center;
    }
    .header h1 {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .header p {
      opacity: 0.9;
      font-size: 14px;
    }
    .content {
      padding: 32px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 24px;
    }
    .info-block h3 {
      font-size: 12px;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 8px;
      letter-spacing: 0.5px;
    }
    .info-block p {
      font-size: 14px;
      line-height: 1.6;
    }
    .divider {
      height: 1px;
      background: #e2e8f0;
      margin: 24px 0;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
    }
    .items-table th {
      text-align: left;
      font-size: 12px;
      text-transform: uppercase;
      color: #64748b;
      padding: 12px 0;
      border-bottom: 2px solid #e2e8f0;
    }
    .items-table td {
      padding: 16px 0;
      border-bottom: 1px solid #f1f5f9;
    }
    .items-table .amount {
      text-align: right;
      font-weight: 600;
    }
    .totals {
      margin-top: 24px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 14px;
    }
    .totals-row.total {
      font-size: 18px;
      font-weight: 700;
      color: #3b82f6;
      border-top: 2px solid #e2e8f0;
      padding-top: 16px;
      margin-top: 8px;
    }
    .footer {
      background: #f8fafc;
      padding: 24px 32px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
    }
    .badge {
      display: inline-block;
      background: #dcfce7;
      color: #166534;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      margin-top: 8px;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .receipt {
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <h1>Reçu de paiement</h1>
      <p>Plombier Urgent</p>
    </div>

    <div class="content">
      <div class="info-row">
        <div class="info-block">
          <h3>Client</h3>
          <p>
            <strong>${artisanName}</strong><br>
            ${artisanAddress || ""}
            ${profile?.siret ? `<br>SIRET: ${profile.siret}` : ""}
            ${profile?.email ? `<br>${profile.email}` : ""}
          </p>
        </div>
        <div class="info-block" style="text-align: right;">
          <h3>Reçu</h3>
          <p>
            <strong>#${purchase.lemonsqueezy_order_id}</strong><br>
            ${formattedDate}<br>
            ${formattedTime}
          </p>
          <span class="badge">✓ Payé</span>
        </div>
      </div>

      <div class="divider"></div>

      <table class="items-table">
        <thead>
          <tr>
            <th>Description</th>
            <th style="text-align: right;">Montant</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>${purchase.pack_name}</strong><br>
              <span style="color: #64748b; font-size: 13px;">
                ${purchase.credits_purchased} crédits pour leads
              </span>
            </td>
            <td class="amount">${amountHT} €</td>
          </tr>
        </tbody>
      </table>

      <div class="totals">
        <div class="totals-row">
          <span>Sous-total HT</span>
          <span>${amountHT} €</span>
        </div>
        <div class="totals-row">
          <span>TVA (20%)</span>
          <span>${amountTVA} €</span>
        </div>
        <div class="totals-row total">
          <span>Total TTC</span>
          <span>${amountTTC} €</span>
        </div>
      </div>
    </div>

    <div class="footer">
      <p>
        Merci pour votre confiance !<br>
        Ce reçu a été généré automatiquement par Plombier Urgent.<br>
        Pour toute question, contactez-nous à support@plombier-urgent.fr
      </p>
    </div>
  </div>
</body>
</html>
  `;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="recu-${purchase.lemonsqueezy_order_id}.html"`,
    },
  });
}
