import { Loader2, RotateCcw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { LandingChange } from '@/utils/landingDiff';

interface ChangeSummaryProps {
  changes: LandingChange[];
  saving?: boolean;
  onDiscard: () => void;
  onPublish: () => void;
}

export function ChangeSummary({ changes, saving, onDiscard, onPublish }: ChangeSummaryProps) {
  if (changes.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-5 text-center">
        <p className="text-sm font-semibold">No hay cambios pendientes.</p>
        <p className="mt-1 text-xs text-muted-foreground">Edita un campo para ver el resumen antes de publicar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
      <div>
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-sm font-black">Resumen de cambios</h4>
          <span className="rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-black text-primary-foreground">
            {changes.length}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Revisa qué cambiará en tu landing antes de publicar.
        </p>
      </div>

      <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
        {changes.map((change) => (
          <div key={change.field} className="rounded-xl border border-border/70 bg-background p-3">
            <div className="text-xs font-bold">{change.label}</div>
            <div className="mt-2 grid gap-1 text-[11px]">
              <div className="text-muted-foreground">
                <span className="font-bold text-foreground/70">Ahora: </span>
                {change.before}
              </div>
              <div className="text-primary">
                <span className="font-bold">Con cambios: </span>
                {change.after}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onDiscard} disabled={saving} className="font-bold">
          <RotateCcw className="mr-2 h-4 w-4" />
          Descartar
        </Button>
        <Button type="button" onClick={onPublish} disabled={saving} className="font-bold">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Publicar cambios
        </Button>
      </div>
    </div>
  );
}
