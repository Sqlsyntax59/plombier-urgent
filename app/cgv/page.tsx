import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Conditions Générales de Vente - Plombier Urgent",
  description: "Conditions générales de vente et d'utilisation de la plateforme Plombier Urgent",
};

export default function CGVPage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Link href="/" className="font-bold text-xl text-primary">
            Plombier Urgent
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour
        </Link>

        <h1 className="text-3xl font-bold mb-8">Conditions Generales de Vente et d'Utilisation</h1>

        <div className="prose prose-gray max-w-none space-y-6">
          <p className="text-sm text-muted-foreground">
            Derniere mise a jour : {new Date().toLocaleDateString("fr-FR")}
          </p>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">1. Objet</h2>
            <p>
              Les presentes conditions generales regissent l'utilisation de la plateforme
              Plombier Urgent (ci-apres "la Plateforme"), service de mise en relation entre
              des particuliers (ci-apres "Clients") et des artisans professionnels
              (ci-apres "Artisans").
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">2. Role de la Plateforme</h2>
            <p>
              La Plateforme agit exclusivement en tant qu'intermediaire technique. Elle met
              en relation des Clients ayant un besoin d'intervention avec des Artisans
              independants.
            </p>
            <p className="mt-2 font-medium">
              La Plateforme n'est en aucun cas partie au contrat de prestation qui lie
              directement le Client et l'Artisan.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">3. Limitation de Responsabilite</h2>
            <p>La Plateforme decline toute responsabilite concernant :</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>La qualite, la conformite ou le resultat des interventions realisees par les Artisans</li>
              <li>Les dommages directs ou indirects resultant d'une intervention</li>
              <li>Les litiges entre Clients et Artisans</li>
              <li>Les retards, annulations ou defauts de prestation</li>
              <li>Les informations fournies par les Artisans (tarifs, disponibilite, competences)</li>
              <li>Tout prejudice financier, materiel ou moral subi par l'une des parties</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">4. Obligations des Artisans</h2>
            <p>En s'inscrivant sur la Plateforme, l'Artisan declare et garantit :</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Etre un professionnel dument enregistre et assure</li>
              <li>Disposer des qualifications necessaires a l'exercice de son activite</li>
              <li>Fournir des informations exactes et a jour</li>
              <li>Respecter la reglementation en vigueur</li>
              <li>Assumer l'entiere responsabilite de ses prestations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">5. Obligations des Clients</h2>
            <p>Le Client s'engage a :</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Fournir des informations exactes sur son besoin</li>
              <li>Etre present ou joignable lors de l'intervention</li>
              <li>Regler directement l'Artisan pour la prestation effectuee</li>
              <li>Signaler tout litige directement a l'Artisan concerne</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">6. Tarification</h2>
            <p>
              Les prix affiches sur la Plateforme sont purement indicatifs. Le tarif final
              de l'intervention est determine par l'Artisan apres diagnostic sur place.
              Aucun paiement n'est effectue via la Plateforme.
            </p>
            <p className="mt-2">
              Les Artisans s'acquittent d'un systeme de credits pour acceder aux demandes
              de Clients. Ce systeme est independant des prestations realisees.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">7. Protection des Donnees</h2>
            <p>
              Les donnees personnelles collectees sont traitees conformement au RGPD.
              Elles sont utilisees uniquement pour la mise en relation et ne sont pas
              revendues a des tiers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">8. Litiges</h2>
            <p>
              En cas de litige concernant une intervention, le Client doit s'adresser
              directement a l'Artisan concerne. La Plateforme peut, a sa discretion,
              faciliter la communication mais ne saurait etre tenue responsable de
              l'issue du litige.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">9. Modification des CGV</h2>
            <p>
              La Plateforme se reserve le droit de modifier les presentes conditions
              a tout moment. Les utilisateurs seront informes des modifications
              significatives.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">10. Droit Applicable</h2>
            <p>
              Les presentes conditions sont soumises au droit francais. Tout litige
              relatif a leur interpretation ou execution releve de la competence
              des tribunaux francais.
            </p>
          </section>

          <section className="mt-12 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              En utilisant la Plateforme, vous reconnaissez avoir lu, compris et accepte
              les presentes Conditions Generales de Vente et d'Utilisation.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
