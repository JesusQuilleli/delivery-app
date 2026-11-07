const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../frontend/src/components/cms/LandingSettings.tsx');
let content = fs.readFileSync(filePath, 'utf8');
const isCrlf = content.includes('\r\n');
let normalized = content.replace(/\r\n/g, '\n');

// 1. Add Lock to imports
if (!normalized.includes('Lock,')) {
  normalized = normalized.replace('LayoutTemplate,', 'LayoutTemplate,\n  Lock,');
}

// 2. Change 3 Layouts to 6 Estilos Web
normalized = normalized.replace('Diseño de Tienda (3 Layouts)', 'Diseño de Tienda (6 Estilos Web)');

// 3. Find and replace the map block
const startMarker = '<div className="grid grid-cols-1 gap-2.5">\n              {LANDING_LAYOUT_OPTIONS.map(';
const endMarker = '              })}\n            </div>';

const startIdx = normalized.indexOf(startMarker);
const endIdx = normalized.indexOf(endMarker, startIdx);

if (startIdx === -1 || endIdx === -1) {
  console.error('Markers not found', { startIdx, endIdx });
  process.exit(1);
}

const replacement = `<div className="grid grid-cols-1 gap-2.5">
              {(() => {
                const storePlan = String(store?.plan || 'EMPRENDEDOR').toUpperCase();
                const PLAN_TIER_ORDER: Record<string, number> = {
                  EMPRENDEDOR: 1,
                  NEGOCIO: 2,
                  PRO: 3
                };
                const userTierLevel = PLAN_TIER_ORDER[storePlan] || 1;

                return LANDING_LAYOUT_OPTIONS.map((layout) => {
                  const active = (draftConfig.layout_variant || 'hero_split') === layout.value;
                  const layoutRequiredLevel = PLAN_TIER_ORDER[layout.minPlan] || 1;
                  const isLocked = layoutRequiredLevel > userTierLevel;

                  if (isLocked) {
                    return (
                      <button
                        key={layout.value}
                        type="button"
                        onClick={() => {
                          toast.info(\`El diseño "\${layout.label}" está disponible a partir del \${layout.minPlanLabel}. Puedes solicitar una mejora de plan en SuperAdmin.\`);
                        }}
                        className="p-3.5 rounded-2xl border border-dashed border-gray-300 bg-gray-50/70 text-left transition-all flex items-start gap-3.5 opacity-70 hover:bg-gray-100/80 cursor-pointer"
                      >
                        <span className="text-2xl p-2 bg-white rounded-xl shadow-xs border border-border shrink-0 opacity-50">
                          {layout.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-xs text-gray-700 flex items-center gap-1.5">
                              <Lock size={12} className="text-amber-600" /> {layout.label}
                            </span>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                              {layout.minPlanLabel}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 font-medium mt-1 leading-snug">{layout.description}</p>
                        </div>
                      </button>
                    );
                  }

                  return (
                    <button
                      key={layout.value}
                      type="button"
                      onClick={() => updateConfig({ layout_variant: layout.value })}
                      className={\`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3.5 \${
                        active
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/30 shadow-xs'
                          : 'border-border hover:bg-muted/30'
                      }\`}
                    >
                      <span className="text-2xl p-2 bg-white rounded-xl shadow-xs border border-border shrink-0">
                        {layout.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-black text-xs text-gray-950">{layout.label}</span>
                          <span className={\`text-[10px] font-black px-2 py-0.5 rounded-full \${
                            active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                          }\`}>
                            {layout.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 font-medium mt-1 leading-snug">{layout.description}</p>
                      </div>
                      {active && <Check className="h-4 w-4 shrink-0 text-primary mt-1" />}
                    </button>
                  );
                });
              })()}
            </div>`;

normalized = normalized.substring(0, startIdx) + replacement + normalized.substring(endIdx + endMarker.length);

const finalContent = isCrlf ? normalized.replace(/\n/g, '\r\n') : normalized;
fs.writeFileSync(filePath, finalContent, 'utf8');
console.log('Successfully patched LandingSettings.tsx with 6 layouts and plan locking!');
