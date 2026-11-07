const fs = require('fs');
const path = require('path');

// 1. Clean duplicate in Dashboard.tsx
const dashboardPath = path.join(__dirname, '..', 'frontend', 'src', 'pages', 'Dashboard.tsx');
let dashboardCode = fs.readFileSync(dashboardPath, 'utf8');
dashboardCode = dashboardCode.replace(
  '<NotificationPermissionBanner role="admin" className="mb-4" />',
  ''
);
fs.writeFileSync(dashboardPath, dashboardCode, 'utf8');
console.log('Successfully cleaned Dashboard.tsx duplicate banner!');

// 2. Add banner to Layout.tsx for storefront customers
const layoutPath = path.join(__dirname, '..', 'frontend', 'src', 'components', 'Layout.tsx');
let layoutCode = fs.readFileSync(layoutPath, 'utf8');

if (!layoutCode.includes('NotificationPermissionBanner')) {
  layoutCode = layoutCode.replace(
    "import { ThemeProvider } from './ThemeProvider';",
    "import { ThemeProvider } from './ThemeProvider';\nimport { NotificationPermissionBanner } from './NotificationPermissionBanner';"
  );
}

const mainTarget = `<main className="max-w-5xl mx-auto pb-20">
        <Outlet />
      </main>`;

const mainReplacement = `<main className="max-w-5xl mx-auto pb-20 px-4">
        <NotificationPermissionBanner role="customer" className="mt-4 mb-2" />
        <Outlet />
      </main>`;

if (layoutCode.includes(mainTarget)) {
  layoutCode = layoutCode.replace(mainTarget, mainReplacement);
} else {
  layoutCode = layoutCode.replace(
    '<main className="max-w-5xl mx-auto pb-20">',
    '<main className="max-w-5xl mx-auto pb-20 px-4">\n        <NotificationPermissionBanner role="customer" className="mt-4 mb-2" />'
  );
}

fs.writeFileSync(layoutPath, layoutCode, 'utf8');
console.log('Successfully patched Layout.tsx with customer notification banner!');

// 3. Add banner to Checkout.tsx in tracking view (Case 5)
const checkoutPath = path.join(__dirname, '..', 'frontend', 'src', 'pages', 'Checkout.tsx');
let checkoutCode = fs.readFileSync(checkoutPath, 'utf8');

if (!checkoutCode.includes('NotificationPermissionBanner')) {
  checkoutCode = checkoutCode.replace(
    "import { requestNotificationPermission } from '../lib/notifications';",
    "import { requestNotificationPermission } from '../lib/notifications';\nimport { NotificationPermissionBanner } from '../components/NotificationPermissionBanner';"
  );
}

const checkoutCase5Target = `<CardContent className="p-5 sm:p-8 sm:px-10">
              <div className="relative border-l-4 border-gray-100 ml-6 space-y-10">`;

const checkoutCase5Replacement = `<CardContent className="p-5 sm:p-8 sm:px-10">
              <NotificationPermissionBanner role="customer" className="mb-6" />
              <div className="relative border-l-4 border-gray-100 ml-6 space-y-10">`;

if (checkoutCode.includes(checkoutCase5Target)) {
  checkoutCode = checkoutCode.replace(checkoutCase5Target, checkoutCase5Replacement);
} else {
  console.warn('Could not find checkoutCase5Target, trying regex');
  checkoutCode = checkoutCode.replace(
    /<CardContent className="p-5 sm:p-8 sm:px-10">\s*<div className="relative border-l-4 border-gray-100 ml-6 space-y-10">/,
    checkoutCase5Replacement
  );
}

fs.writeFileSync(checkoutPath, checkoutCode, 'utf8');
console.log('Successfully patched Checkout.tsx with tracking notification banner!');
