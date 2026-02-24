import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { LifecycleStage } from '@/types/lifecycle';

// Define lifecycle stages directly in this component for reliability
const STAGES = [
  { key: 'raw_material_acquisition' as LifecycleStage, label: 'Rohstofferwerb' },
  { key: 'production' as LifecycleStage, label: 'Produktion' },
  { key: 'distribution' as LifecycleStage, label: 'Verteilung' },
  { key: 'use' as LifecycleStage, label: 'Nutzung' },
  { key: 'end_of_life' as LifecycleStage, label: 'Behandlung am Ende des Lebenswegs' },
];

export function CanvasToolbar({ 
  onAddProcess, 
  onClear 
}: {
  onAddProcess: (stage: LifecycleStage) => void;
  onClear: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="default">Prozess hinzufügen</Button>
        </PopoverTrigger>
        <PopoverContent 
          align="start"
          sideOffset={5}
          side="bottom" 
          className="w-80 bg-neutral-900 border-neutral-800 text-white mr-4"
        >
          <div className="grid gap-1 px-1">
            {STAGES.map(s => {
              // Behandeln wir den langen Text speziell
              const isLong = s.key === 'end_of_life';
              return (
                <Button 
                  key={s.key} 
                  variant="ghost" 
                  className={`justify-start text-white hover:bg-neutral-800 py-2 ${isLong ? 'text-sm leading-tight' : ''}`}
                  onClick={() => {
                    console.log("Stage selected:", s.key);
                    onAddProcess(s.key);
                  }}
                >
                  {s.label}
                </Button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
      <Button variant="destructive" onClick={onClear}>Leeren</Button>
    </div>
  );
}
