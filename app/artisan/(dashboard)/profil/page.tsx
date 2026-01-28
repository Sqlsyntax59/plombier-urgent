import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProfilPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Mon Profil</h2>
        <p className="text-muted-foreground">
          Gerez vos informations personnelles
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Cette page sera implementee dans la Story 2.6
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
