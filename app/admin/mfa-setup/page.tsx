"use client";

import { useState } from "react";
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
import { ShieldCheck, Loader2, QrCode, LogOut } from "lucide-react";

type EnrollData = {
  id: string;
  totp: {
    qr_code: string;
    secret: string;
    uri: string;
  };
};

export default function MfaSetupPage() {
  const [enrollData, setEnrollData] = useState<EnrollData | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleEnroll = async () => {
    setIsEnrolling(true);
    setError(null);

    const { data, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Admin TOTP",
    });

    if (enrollError) {
      setError(enrollError.message);
      setIsEnrolling(false);
      return;
    }

    setEnrollData(data);
    setIsEnrolling(false);
  };

  const handleVerify = async () => {
    if (!enrollData || code.length !== 6) return;
    setIsVerifying(true);
    setError(null);

    const { data: challenge, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId: enrollData.id });

    if (challengeError) {
      setError(challengeError.message);
      setIsVerifying(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: enrollData.id,
      challengeId: challenge.id,
      code,
    });

    if (verifyError) {
      setError("Code invalide. Veuillez reessayer.");
      setCode("");
      setIsVerifying(false);
      return;
    }

    router.push("/admin/dashboard");
  };

  // Etape 1 : bouton pour lancer l'enrolement
  if (!enrollData) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <ShieldCheck className="w-12 h-12 text-red-600 mx-auto mb-2" />
            <CardTitle>Configuration 2FA</CardTitle>
            <CardDescription>
              Protegez votre compte admin avec l&apos;authentification a deux
              facteurs (TOTP).
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <p className="text-sm text-slate-500 text-center">
              Vous aurez besoin d&apos;une application comme Google Authenticator,
              Authy ou 1Password.
            </p>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button
              onClick={handleEnroll}
              disabled={isEnrolling}
              className="w-full"
            >
              {isEnrolling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generation...
                </>
              ) : (
                <>
                  <QrCode className="w-4 h-4 mr-2" />
                  Generer le QR code
                </>
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

  // Etape 2 : QR code + verification
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <ShieldCheck className="w-12 h-12 text-red-600 mx-auto mb-2" />
          <CardTitle>Scannez le QR code</CardTitle>
          <CardDescription>
            Scannez ce QR code avec votre application d&apos;authentification,
            puis entrez le code a 6 chiffres pour confirmer.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          {/* QR Code SVG */}
          <div
            className="bg-white p-4 rounded-lg border"
            dangerouslySetInnerHTML={{ __html: enrollData.totp.qr_code }}
          />

          {/* Secret en fallback */}
          <div className="text-center">
            <p className="text-xs text-slate-400 mb-1">
              Ou entrez ce code manuellement :
            </p>
            <code className="text-xs bg-slate-100 px-3 py-1 rounded font-mono select-all">
              {enrollData.totp.secret}
            </code>
          </div>

          {/* Input OTP */}
          <InputOTP
            maxLength={6}
            value={code}
            onChange={setCode}
            disabled={isVerifying}
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
            disabled={code.length !== 6 || isVerifying}
            className="w-full"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verification...
              </>
            ) : (
              "Activer la 2FA"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
