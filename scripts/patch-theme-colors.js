const fs = require('fs');
const path = require('path');

// 1. Patch Layout.tsx
const layoutPath = path.resolve(__dirname, '../frontend/src/components/Layout.tsx');
let layoutContent = fs.readFileSync(layoutPath, 'utf8');

layoutContent = layoutContent.replace(
  'bg-orange-500 rounded-xl flex items-center justify-center shadow-inner',
  'bg-primary text-primary-foreground rounded-xl flex items-center justify-center shadow-md'
);
layoutContent = layoutContent.replace('hover:text-orange-500', 'hover:text-primary');
layoutContent = layoutContent.replace('<ShoppingCart size={24} className="text-orange-500" />', '<ShoppingCart size={24} className="text-primary" />');
layoutContent = layoutContent.replace('bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-orange-100', 'bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 border border-primary/20');
layoutContent = layoutContent.replace('className="text-orange-500/50"', 'className="text-primary"');
layoutContent = layoutContent.replace('text-orange-600 bg-orange-50', 'text-primary bg-primary/10');
layoutContent = layoutContent.replace('shadow-orange-500/20 hover:shadow-orange-500/40', 'bg-primary text-primary-foreground shadow-primary/20 hover:shadow-primary/30');

fs.writeFileSync(layoutPath, layoutContent, 'utf8');
console.log('Successfully updated Layout.tsx');

// 2. Patch Checkout.tsx stepper & timeline
const checkoutPath = path.resolve(__dirname, '../frontend/src/pages/Checkout.tsx');
let checkoutContent = fs.readFileSync(checkoutPath, 'utf8');

checkoutContent = checkoutContent.replace(/bg-orange-500/g, 'bg-primary');
checkoutContent = checkoutContent.replace(/text-orange-600/g, 'text-primary');
checkoutContent = checkoutContent.replace(/text-orange-700/g, 'text-primary');
checkoutContent = checkoutContent.replace(/text-orange-800/g, 'text-primary');
checkoutContent = checkoutContent.replace(/bg-orange-50\/50/g, 'bg-primary/5');
checkoutContent = checkoutContent.replace(/bg-orange-50/g, 'bg-primary/10');
checkoutContent = checkoutContent.replace(/border-orange-100/g, 'border-primary/20');
checkoutContent = checkoutContent.replace(/border-orange-200/g, 'border-primary/30');
checkoutContent = checkoutContent.replace(/shadow-orange-500\/40/g, 'shadow-primary/40');
checkoutContent = checkoutContent.replace(/shadow-orange-500\/30/g, 'shadow-primary/30');
checkoutContent = checkoutContent.replace(/shadow-orange-500\/20/g, 'shadow-primary/20');

fs.writeFileSync(checkoutPath, checkoutContent, 'utf8');
console.log('Successfully updated Checkout.tsx');
