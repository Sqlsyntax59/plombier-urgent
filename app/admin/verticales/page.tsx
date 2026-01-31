"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers, Construction } from "lucide-react";

export default function AdminVerticalesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Layers className="w-6 h-6 text-purple-500" />
          Gestion des Verticales
        </h2>
        <p className="text-muted-foreground">
          Configuration des métiers et spécialisations
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Construction className="w-5 h-5 text-orange-500" />
            Fonctionnalité à venir
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            La gestion multi-verticales (électricien, serrurier, chauffagiste...)
            sera disponible dans une prochaine version.
          </p>
          <div className="mt-4 p-4 bg-slate-50 rounded-lg">
            <p className="text-sm font-medium">Verticale actuelle :</p>
            <p className="text-lg font-bold text-blue-600">Plomberie</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
