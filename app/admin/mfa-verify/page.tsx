"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { ShieldCheck, Loader2, LogOut } from "lucide-react";
import Link from "next/link";

export default function MfaVerifyPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFactors, setHasFactors] = useState<boolean | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function checkFactors() {
      const { data } = await supabase.auth.mfa.listFactors();
      const totp = data?.totp ?? [];
      const verified = totp.filter((f) => f.status === "verified");
      if (verified.length > 0) {
        setHasFactors(true);
        setFactorId(verified[0].id);
      } else {
        setHasFactors(false);
      }
    }
    checkFactors();
  }, [supabase]);

  const handleVerify = async () => {
    if (!factorId || code.length !== 6) return;
    setIsLoading(true);
    setError(null);

    const { data: challenge, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId });

    if (challengeError) {
      setError(challengeError.message);
      setIsLoading(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    });

    if (verifyError) {
      setError("Code invalide. Veuillez reessayer.");
      setCode("");
      setIsLoading(false);
      return;
    }

    router.push("/admin/dashboard");
  };

  // Auto-submit quand 6 chiffres saisis
  useEffect(() => {
    if (code.length === 6 && factorId) {
      handleVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  if (hasFactors === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (hasFactors === false) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <ShieldCheck className="w-12 h-12 text-orange-500 mx-auto mb-2" />
            <CardTitle>2FA requis</CardTitle>
            <CardDescription>
              Vous devez configurer l&apos;authentification a deux facteurs pour
              acceder a l&apos;administration.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Link href="/admin/mfa-setup">
              <Button className="w-full">Configurer la 2FA</Button>
            </Link>
            <Button
              variant="ghost"
              className="w-full text-slate-500"
              onClick={async () => {
                await supabase.auth.signOut();
                router.push("/");
              }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Se deconnecter
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <ShieldCheck className="w-12 h-12 text-red-600 mx-auto mb-2" />
          <CardTitle>Verification 2FA</CardTitle>
          <CardDescription>
            Entrez le code a 6 chiffres de votre application d&apos;authentification.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <InputOTP
            maxLength={6}
            value={code}
            onChange={setCode}
            disabled={isLoading}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button
            onClick={handleVerify}
            disabled={code.length !== 6 || isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verification...
              </>
            ) : (
              "Verifier"
            )}
          </Button>

          <Button
            variant="ghost"
            className="w-full text-slate-500"
            onClick={async () => {
              await supabase.auth.signOut();
              router.push("/");
            }}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Se deconnecter
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
