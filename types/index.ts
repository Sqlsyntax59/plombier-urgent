/**
 * Types globaux pour l'application SaaS Artisans Urgents
 */

// Types de base - seront completees dans les stories suivantes
export type VerticalId = "plombier" | "electricien" | "serrurier";

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

// Placeholder - types detailles dans Epic 2+
export interface Artisan extends BaseEntity {
  // A completer Story 2.1
}

export interface Lead extends BaseEntity {
  // A completer Story 3.1
}
