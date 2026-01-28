import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LeadsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Mes Leads</h2>
        <p className="text-muted-foreground">
          Consultez et gerez vos demandes clients
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aucun lead pour le moment</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Vos leads apparaitront ici une fois que vous en recevrez.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
