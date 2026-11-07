const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../frontend/src/components/cms/LandingSettings.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const isCrlf = content.includes('\r\n');
let normalized = content.replace(/\r\n/g, '\n');

// 1. Update imports
const oldImport = `  DEFAULT_LANDING_CONFIG,
  LANDING_SECTION_OPTIONS,`;
const newImport = `  DEFAULT_LANDING_CONFIG,
  LANDING_SECTION_OPTIONS,
  LANDING_LAYOUT_OPTIONS,`;

if (!normalized.includes(oldImport)) {
  console.error('Target import not found');
  process.exit(1);
}
normalized = normalized.replace(oldImport, newImport);

// 2. Update step 0 label
normalized = normalized.replace("{ id: 'brand', label: 'Marca y color' }", "{ id: 'brand', label: 'Diseño y color' }");

// 3. Update step 0 rendering
const targetStep0 = `    if (stepIndex === 0) {
      return (
        <div className="space-y-5">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider">
              <Palette size={16} className="text-primary" /> Marca y color
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              El color se aplica a botones, enlaces, badges y detalles de toda la tienda.
            </p>
          </div>`;

const replacementStep0 = `    if (stepIndex === 0) {
      return (
        <div className="space-y-6">
          {/* Selector de Diseño Web (3 Layouts) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-gray-900">
                <LayoutTemplate size={16} className="text-primary" /> Diseño de Tienda (3 Layouts)
              </h3>
              <span className="text-[10px] font-black text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                Multidiseño CMS
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Elige cómo estructurar la portada, los banners promocionales y la vitrina de productos de tu tienda.
            </p>

            <div className="grid grid-cols-1 gap-2.5">
              {LANDING_LAYOUT_OPTIONS.map((layout) => {
                const active = (draftConfig.layout_variant || 'hero_split') === layout.value;
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
              })}
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-gray-900">
              <Palette size={16} className="text-primary" /> Color Principal de la Marca
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Este color se aplica instantáneamente a botones, halos, banners, badges y acentos de tu landing.
            </p>
          </div>`;

if (!normalized.includes(targetStep0)) {
  console.error('Target step 0 not found');
  process.exit(1);
}
normalized = normalized.replace(targetStep0, replacementStep0);

const finalContent = isCrlf ? normalized.replace(/\n/g, '\r\n') : normalized;
fs.writeFileSync(filePath, finalContent, 'utf8');
console.log('Successfully updated LandingSettings.tsx with 3 layout selector and dynamic theme!');
