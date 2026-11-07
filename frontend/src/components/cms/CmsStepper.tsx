import { Check } from 'lucide-react';

export interface CmsStep {
  id: string;
  label: string;
}

interface CmsStepperProps {
  steps: CmsStep[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

export function CmsStepper({ steps, activeIndex, onSelect }: CmsStepperProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {steps.map((step, index) => {
        const active = index === activeIndex;
        const completed = index < activeIndex;
        return (
          <button
            key={step.id}
            type="button"
            onClick={() => onSelect(index)}
            className={`flex min-w-fit items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition ${
              active
                ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                : completed
                  ? 'border-primary/30 bg-primary/5 text-primary'
                  : 'border-border bg-background text-muted-foreground hover:bg-muted/40'
            }`}
          >
            <span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] ${
              active ? 'bg-primary-foreground/20' : completed ? 'bg-primary/10' : 'bg-muted'
            }`}>
              {completed ? <Check size={12} /> : index + 1}
            </span>
            {step.label}
          </button>
        );
      })}
    </div>
  );
}
