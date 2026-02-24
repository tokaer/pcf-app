export type LifecyclePhase = 
  | "material"
  | "production"
  | "distribution"
  | "use"
  | "eol";

export const LIFECYCLE_PHASES: Record<LifecyclePhase, string> = {
  material: "Rohstofferwerb",
  production: "Produktion",
  distribution: "Verteilung",
  use: "Nutzung",
  eol: "Behandlung am Ende des Lebenswegs",
};
