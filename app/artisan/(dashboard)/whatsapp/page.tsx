import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function WhatsAppConfigPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Configuration WhatsApp</h2>
        <p className="text-muted-foreground">
          Configurez votre numero WhatsApp pour recevoir les notifications de
          leads
        </p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Numero WhatsApp</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Cette fonctionnalite sera implementee dans la Story 2.3
          </p>
          <Button variant="outline" asChild>
            <Link href="/artisan/dashboard">
              Passer cette etape (temporaire)
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
