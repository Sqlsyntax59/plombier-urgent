import { CheckCircle } from "lucide-react";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{ leadId?: string; balance?: string }>;
}

export default async function LeadAcceptedPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { leadId, balance } = params;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Lead accepte avec succes !
        </h1>

        <p className="text-gray-600 mb-6">
          Vous avez ete attribue a ce client. Vous pouvez maintenant le
          contacter.
        </p>

        {balance !== undefined && (
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-600 mb-1">Votre solde actuel</p>
            <p className="text-3xl font-bold text-blue-700">{balance} credits</p>
          </div>
        )}

        <div className="space-y-3">
          <Link
            href="/artisan/dashboard"
            className="block w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Voir mes leads
          </Link>

          {leadId && (
            <Link
              href={`/artisan/leads/${leadId}`}
              className="block w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Details du lead
            </Link>
          )}
        </div>

        <p className="text-xs text-gray-400 mt-6">
          Un email avec les coordonnees du client vous a ete envoye.
        </p>
      </div>
    </div>
  );
}
