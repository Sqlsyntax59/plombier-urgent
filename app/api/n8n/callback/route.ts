import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateAcceptUrl } from "@/lib/actions/assignment";

// Client Supabase avec service_role pour bypasser RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Verification du secret n8n
function verifyN8nSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const expectedSecret = process.env.N8N_CALLBACK_SECRET;

  if (!expectedSecret) {
    console.error("N8N_CALLBACK_SECRET not configured");
    return false;
  }

  // Accepter les deux formats: "Bearer <token>" ou juste "<token>"
  const tokenWithBearer = `Bearer ${expectedSecret}`;
  return authHeader === tokenWithBearer || authHeader === expectedSecret;
}

type CallbackAction =
  | "find_artisan"
  | "find_artisans_multi"
  | "create_assignment"
  | "expire_assignment"
  | "get_lead_details"
  | "check_lead_status"
  | "mark_lead_unassigned";

interface CallbackRequest {
  action: CallbackAction;
  params: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  // Verifier authentification
  if (!verifyN8nSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: CallbackRequest = await request.json();
    const { action, params } = body;

    if (!action || !params) {
      return NextResponse.json(
        { error: "Missing action or params" },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case "find_artisan": {
        const { lead_id, vertical_id } = params as {
          lead_id: string;
          vertical_id?: string;
        };

        const { data, error } = await supabaseAdmin.rpc(
          "find_available_artisan",
          {
            p_lead_id: lead_id,
            p_vertical_id: vertical_id || null,
          }
        );

        if (error) throw error;
        result = { artisan: data?.[0] || null };
        break;
      }

      case "find_artisans_multi": {
        const { lead_id, vertical_id, wave, limit } = params as {
          lead_id: string;
          vertical_id?: string;
          wave?: number;
          limit?: number;
        };

        const waveNumber = wave || 1;
        const artisanLimit = limit || 3;

        // Trouver N artisans via RPC
        const { data: artisansData, error: artisansError } = await supabaseAdmin.rpc(
          "find_available_artisans",
          {
            p_lead_id: lead_id,
            p_vertical_id: vertical_id || null,
            p_limit: artisanLimit,
          }
        );

        if (artisansError) throw artisansError;

        if (!artisansData || artisansData.length === 0) {
          result = { artisans: [], wave: waveNumber, no_artisan_available: true };
          break;
        }

        // Créer les assignments et générer les URLs
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://plombier-urgent.vercel.app";
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
        const artisanResults = [];

        for (let i = 0; i < artisansData.length; i++) {
          const a = artisansData[i];
          const cascadeOrder = (waveNumber - 1) * artisanLimit + (i + 1);

          const { data: assignData, error: assignErr } = await supabaseAdmin
            .from("lead_assignments")
            .insert({
              lead_id,
              artisan_id: a.artisan_id,
              cascade_order: cascadeOrder,
              wave_number: waveNumber,
              status: "pending",
              notified_at: new Date().toISOString(),
              expires_at: expiresAt,
            })
            .select("id")
            .single();

          if (assignErr) {
            console.error("Erreur assignment multi:", assignErr);
            continue;
          }

          const acceptUrl = await generateAcceptUrl(assignData.id, a.artisan_id, baseUrl);

          artisanResults.push({
            artisan_id: a.artisan_id,
            artisan_name: a.artisan_name,
            whatsapp_phone: a.whatsapp_phone,
            phone: a.phone,
            distance_km: a.distance_km,
            assignment_id: assignData.id,
            accept_url: acceptUrl,
          });
        }

        // Mettre à jour le lead
        if (artisanResults.length > 0) {
          await supabaseAdmin
            .from("leads")
            .update({ status: "assigned", cascade_count: waveNumber })
            .eq("id", lead_id);
        }

        result = { artisans: artisanResults, wave: waveNumber };
        break;
      }

      case "create_assignment": {
        const { lead_id, artisan_id, cascade_order } = params as {
          lead_id: string;
          artisan_id: string;
          cascade_order: number;
        };

        const { data, error } = await supabaseAdmin.rpc("create_assignment", {
          p_lead_id: lead_id,
          p_artisan_id: artisan_id,
          p_cascade_order: cascade_order || 1,
        });

        if (error) throw error;

        // Generer URL securisee avec JWT pour acceptation
        const assignmentId = data as string;
        const acceptUrl = await generateAcceptUrl(
          assignmentId,
          artisan_id,
          process.env.NEXT_PUBLIC_APP_URL || "https://plombier-urgent.vercel.app"
        );

        result = { assignment_id: assignmentId, accept_url: acceptUrl };
        break;
      }

      case "expire_assignment": {
        const { assignment_id } = params as { assignment_id: string };

        const { data, error } = await supabaseAdmin.rpc("expire_assignment", {
          p_assignment_id: assignment_id,
        });

        if (error) throw error;
        result = data;
        break;
      }

      case "get_lead_details": {
        const { lead_id } = params as { lead_id: string };

        const { data, error } = await supabaseAdmin.rpc("get_lead_details", {
          p_lead_id: lead_id,
        });

        if (error) throw error;
        result = data;
        break;
      }

      case "check_lead_status": {
        const { lead_id } = params as { lead_id: string };

        const { data, error } = await supabaseAdmin.rpc("check_lead_status", {
          p_lead_id: lead_id,
        });

        if (error) throw error;
        result = data;
        break;
      }

      case "mark_lead_unassigned": {
        const { lead_id } = params as { lead_id: string };

        // Marquer le lead comme non assigné (aucun artisan disponible)
        const { error } = await supabaseAdmin
          .from("leads")
          .update({
            status: "unassigned",
            updated_at: new Date().toISOString(),
          })
          .eq("id", lead_id);

        if (error) throw error;
        result = { lead_id, status: "unassigned" };
        break;
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("n8n callback error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : (error as Record<string, unknown>)?.message || JSON.stringify(error),
      },
      { status: 500 }
    );
  }
}
