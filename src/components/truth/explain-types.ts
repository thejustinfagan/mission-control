// Shared shape for requesting an Explain. Cards emit this; the cockpit resolves
// the ids into concrete claims/evidence for the drawer.

export interface ExplainRequest {
  title: string;
  subtitle?: string;
  claimIds: string[];
  evidenceIds: string[];
}

export type ExplainHandler = (req: ExplainRequest) => void;
