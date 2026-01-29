import { XCircle, Clock, AlertTriangle, CreditCard } from "lucide-react";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{ code?: string; message?: string }>;
}

const ERROR_MESSAGES: Record<
  string,
  { title: string; description: string; icon: React.ReactNode }
> = {
  LEAD_ALREADY_ACCEPTED: {
    title: "Lead deja accepte",
    description:
      "Ce lead a deja ete accepte par un autre artisan. Ne vous inquietez pas, de nouveaux leads arrivent regulierement !",
    icon: <Clock className="w-12 h-12 text-orange-500" />,
  },
  ASSIGNMENT_NOT_PENDING: {
    title: "Attribution expiree",
    description:
      "Le delai de 2 minutes pour accepter ce lead est depasse. Soyez plus rapide la prochaine fois !",
    icon: <Clock className="w-12 h-12 text-orange-500" />,
  },
  INSUFFICIENT_CREDITS: {
    title: "Credits insuffisants",
    description:
      "Vous n'avez pas assez de credits pour accepter ce lead. Rechargez votre compte pour continuer.",
    icon: <CreditCard className="w-12 h-12 text-red-500" />,
  },
  INVALID_TOKEN: {
    title: "Lien invalide ou expire",
    description:
      "Ce lien d'acceptation n'est plus valide. Il a peut-etre expire ou a deja ete utilise.",
    icon: <AlertTriangle className="w-12 h-12 text-yellow-500" />,
  },
  MISSING_TOKEN: {
    title: "Lien incomplet",
    description: "Le lien que vous avez utilise est incomplet ou malform.",
    icon: <AlertTriangle className="w-12 h-12 text-yellow-500" />,
  },
  ASSIGNMENT_NOT_FOUND: {
    title: "Attribution non trouvee",
    description:
      "Cette attribution n'existe pas ou ne vous appartient pas.",
    icon: <XCircle className="w-12 h-12 text-red-500" />,
  },
};

const DEFAULT_ERROR = {
  title: "Une erreur est survenue",
  description:
    "Impossible de traiter votre demande. Veuillez reessayer ou contacter le support.",
  icon: <XCircle className="w-12 h-12 text-red-500" />,
};

export default async function LeadErrorPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { code, message } = params;

  const errorInfo = code ? ERROR_MESSAGES[code] || DEFAULT_ERROR : DEFAULT_ERROR;

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          {errorInfo.icon}
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {errorInfo.title}
        </h1>

        <p className="text-gray-600 mb-6">{errorInfo.description}</p>

        {message && (
          <div className="bg-gray-50 rounded-lg p-3 mb-6">
            <p className="text-sm text-gray-500 font-mono">{message}</p>
          </div>
        )}

        <div className="space-y-3">
          {code === "INSUFFICIENT_CREDITS" && (
            <Link
              href="/artisan/credits"
              className="block w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Acheter des credits
            </Link>
          )}

          <Link
            href="/artisan/dashboard"
            className="block w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Retour au dashboard
          </Link>

          <Link
            href="/"
            className="block w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Accueil
          </Link>
        </div>

        {code && (
          <p className="text-xs text-gray-400 mt-6">Code erreur: {code}</p>
        )}
      </div>
    </div>
  );
}
