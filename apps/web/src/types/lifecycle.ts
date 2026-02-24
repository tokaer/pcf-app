export type LifecycleStage =
  | 'raw_material_acquisition'
  | 'production'
  | 'distribution'
  | 'use'
  | 'end_of_life';

export const LIFECYCLE_STAGES: { key: LifecycleStage; label: string }[] = [
  { key: 'raw_material_acquisition', label: 'Rohstofferwerb' },
  { key: 'production', label: 'Produktion' },
  { key: 'distribution', label: 'Verteilung' },
  { key: 'use', label: 'Nutzung' },
  { key: 'end_of_life', label: 'Behandlung am Ende des Lebenswegs' },
];
