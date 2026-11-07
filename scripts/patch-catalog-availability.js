const fs = require('fs');
const path = require('path');

// 1. Patch Catalog.tsx
const catalogPath = path.join(__dirname, '..', 'frontend', 'src', 'pages', 'Catalog.tsx');
let catalogCode = fs.readFileSync(catalogPath, 'utf8');

// Add is_available to Product interface
catalogCode = catalogCode.replace(
  'stock?: number | null;',
  'stock?: number | null;\n  is_available?: boolean;'
);

// Update soldOut check
catalogCode = catalogCode.replace(
  'const soldOut = p.stock != null && p.stock <= 0;',
  'const soldOut = p.is_available === false || (p.stock != null && p.stock <= 0);'
);

// Add Agotado badge on image
const imageTarget = `{p.is_combo && (
                        <div className="absolute top-2 left-2 z-10">
                          <Badge className="bg-purple-600 text-white shadow-md border-0 px-2 py-0.5 text-xs font-black uppercase tracking-wider">Combo</Badge>
                        </div>
                      )}`;

const imageReplacement = `{p.is_combo && (
                        <div className="absolute top-2 left-2 z-10">
                          <Badge className="bg-purple-600 text-white shadow-md border-0 px-2 py-0.5 text-xs font-black uppercase tracking-wider">Combo</Badge>
                        </div>
                      )}
                      {soldOut && (
                        <div className="absolute top-2 left-2 z-10">
                          <Badge className="bg-rose-600 text-white shadow-md border-0 px-2.5 py-0.5 text-xs font-black uppercase tracking-wider animate-pulse">Agotado</Badge>
                        </div>
                      )}`;

if (catalogCode.includes(imageTarget)) {
  catalogCode = catalogCode.replace(imageTarget, imageReplacement);
}

// Dim image if soldOut
catalogCode = catalogCode.replace(
  'className="w-full h-full object-contain mix-blend-multiply"',
  'className={`w-full h-full object-contain mix-blend-multiply ${soldOut ? "opacity-35 grayscale" : ""}`}'
);

fs.writeFileSync(catalogPath, catalogCode, 'utf8');
console.log('Successfully patched Catalog.tsx!');

// 2. Patch ProductDetails.tsx
const detailsPath = path.join(__dirname, '..', 'frontend', 'src', 'pages', 'ProductDetails.tsx');
let detailsCode = fs.readFileSync(detailsPath, 'utf8');

detailsCode = detailsCode.replace(
  'const soldOut = product?.stock != null && product.stock <= 0;',
  'const soldOut = product?.is_available === false || (product?.stock != null && product.stock <= 0);'
);

fs.writeFileSync(detailsPath, detailsCode, 'utf8');
console.log('Successfully patched ProductDetails.tsx!');
