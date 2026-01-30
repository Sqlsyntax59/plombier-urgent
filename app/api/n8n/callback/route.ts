import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
  | "create_assignment"
  | "expire_assignment"
  | "get_lead_details"
  | "check_lead_status";

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
        result = { assignment_id: data };
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
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
