const fs = require('fs');
const path = require('path');

// 1. Patch Dashboard.tsx
const dashPath = path.resolve(__dirname, '../frontend/src/pages/Dashboard.tsx');
let dashContent = fs.readFileSync(dashPath, 'utf8');

if (!dashContent.includes('NotificationPermissionBanner')) {
  // Add import
  dashContent = `import { NotificationPermissionBanner } from '../components/NotificationPermissionBanner';\n` + dashContent;
  
  // Place banner inside AdminLayout
  const targetLayout = `<AdminLayout title="Panel de Despachos">`;
  const replacementLayout = `<AdminLayout title="Panel de Despachos">\n      <NotificationPermissionBanner role="admin" className="mb-4" />`;
  dashContent = dashContent.replace(targetLayout, replacementLayout);
  fs.writeFileSync(dashPath, dashContent, 'utf8');
  console.log('Successfully added NotificationPermissionBanner to Dashboard.tsx');
} else {
  console.log('NotificationPermissionBanner already in Dashboard.tsx');
}

// 2. Patch MyOrders.tsx
const ordersPath = path.resolve(__dirname, '../frontend/src/pages/MyOrders.tsx');
let ordersContent = fs.readFileSync(ordersPath, 'utf8');

if (!ordersContent.includes('NotificationPermissionBanner')) {
  ordersContent = `import { NotificationPermissionBanner } from '../components/NotificationPermissionBanner';\n` + ordersContent;

  const targetOrders = `<div className="max-w-4xl mx-auto relative">`;
  const replacementOrders = `<div className="max-w-4xl mx-auto relative">\n        <NotificationPermissionBanner role="customer" className="mb-6" />`;
  ordersContent = ordersContent.replace(targetOrders, replacementOrders);
  fs.writeFileSync(ordersPath, ordersContent, 'utf8');
  console.log('Successfully added NotificationPermissionBanner to MyOrders.tsx');
} else {
  console.log('NotificationPermissionBanner already in MyOrders.tsx');
}
