"use server";

import { createClient } from "@supabase/supabase-js";
import { SignJWT, jwtVerify } from "jose";

// Client Supabase avec service_role pour bypasser RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function getJwtSecret(): Uint8Array {
  if (!process.env.JWT_SECRET) {
    throw new Error(
      "JWT_SECRET environment variable is required. Generate one with: openssl rand -base64 32"
    );
  }
  return new TextEncoder().encode(process.env.JWT_SECRET);
}

export type AcceptLeadResult = {
  success: boolean;
  newBalance?: number;
  leadId?: string;
  error?: string;
  errorCode?: string;
};

// Generer un token JWT pour lien d'acceptation Telegram
export async function generateAcceptToken(
  assignmentId: string,
  artisanId: string
): Promise<string> {
  const token = await new SignJWT({
    assignmentId,
    artisanId,
    type: "lead_accept",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("5m") // Expire dans 5 minutes (marge sur les 2min)
    .setIssuedAt()
    .sign(getJwtSecret());

  return token;
}

// Verifier et decoder un token d'acceptation
export async function verifyAcceptToken(token: string): Promise<{
  valid: boolean;
  assignmentId?: string;
  artisanId?: string;
  error?: string;
}> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());

    if (payload.type !== "lead_accept") {
      return { valid: false, error: "Invalid token type" };
    }

    return {
      valid: true,
      assignmentId: payload.assignmentId as string,
      artisanId: payload.artisanId as string,
    };
  } catch {
    return { valid: false, error: "Token invalid or expired" };
  }
}

// Accepter un lead (appelable depuis la route API)
export async function acceptLead(
  assignmentId: string,
  artisanId: string
): Promise<AcceptLeadResult> {
  try {
    // GUARD: Vérifier que l'artisan est vérifié
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("verification_status")
      .eq("id", artisanId)
      .single();

    if (profileError || !profile) {
      return {
        success: false,
        error: "Profil introuvable",
        errorCode: "PROFILE_NOT_FOUND",
      };
    }

    if (profile.verification_status !== "verified") {
      return {
        success: false,
        error: "Votre compte doit être vérifié pour accepter un lead",
        errorCode: "NOT_VERIFIED",
      };
    }

    const { data, error } = await supabaseAdmin.rpc("accept_lead", {
      p_assignment_id: assignmentId,
      p_artisan_id: artisanId,
    });

    if (error) {
      console.error("RPC accept_lead error:", error);
      return {
        success: false,
        error: "Erreur lors de l'acceptation",
        errorCode: "RPC_ERROR",
      };
    }

    // data est le JSONB retourne par la fonction
    if (!data.success) {
      return {
        success: false,
        error: data.message || "Erreur inconnue",
        errorCode: data.error,
      };
    }

    // Declencher webhook n8n pour notification client
    const webhookUrl = process.env.N8N_WEBHOOK_LEAD_ACCEPTED;
    if (webhookUrl && data.lead_id) {
      fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: data.lead_id,
          artisanId,
          assignmentId,
        }),
      }).catch((err) => console.error("Webhook lead-accepted error:", err));
    }

    return {
      success: true,
      newBalance: data.new_balance,
      leadId: data.lead_id,
    };
  } catch (error) {
    console.error("acceptLead error:", error);
    return {
      success: false,
      error: "Erreur serveur",
      errorCode: "SERVER_ERROR",
    };
  }
}

// Generer l'URL complete d'acceptation pour Telegram
export async function generateAcceptUrl(
  assignmentId: string,
  artisanId: string,
  baseUrl?: string
): Promise<string> {
  const token = await generateAcceptToken(assignmentId, artisanId);
  const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}/api/lead/accept?token=${token}`;
}
