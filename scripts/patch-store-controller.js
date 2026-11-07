const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../backend/controllers/storeController.js');
let content = fs.readFileSync(filePath, 'utf8');

const target = `const {
  getCaracasStartOfDay,
  getCaracasStartOfMonth,
  parseCaracasDateRange
} = require('../utils/dates');`;

const replacement = `const {
  getCaracasDateString,
  getCaracasStartOfDay,
  getCaracasStartOfMonth,
  parseCaracasDateRange
} = require('../utils/dates');`;

const isCrlf = content.includes('\r\n');
const normalizedContent = content.replace(/\r\n/g, '\n');
const normalizedTarget = target.replace(/\r\n/g, '\n');

if (!normalizedContent.includes(normalizedTarget)) {
  console.error('Target not found in storeController.js!');
  process.exit(1);
}

const newNormalized = normalizedContent.replace(normalizedTarget, replacement);
const finalContent = isCrlf ? newNormalized.replace(/\n/g, '\r\n') : newNormalized;

fs.writeFileSync(filePath, finalContent, 'utf8');
console.log('Successfully updated backend/controllers/storeController.js with getCaracasDateString!');
