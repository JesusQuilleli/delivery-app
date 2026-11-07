const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '../backend/controllers/authController.js');
let content = fs.readFileSync(targetFile, 'utf8');

const target = `    const user = await prisma.user.findUnique({
      where: { username },
      include: { store: true }
    });`;

const replacement = `    const trimmedInput = (username || '').trim();
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: trimmedInput },
          { email: trimmedInput.toLowerCase() }
        ]
      },
      include: { store: true }
    });`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(targetFile, content, 'utf8');
  console.log('✅ authController.js updated to support login via email or username');
} else {
  console.log('Could not find target block in authController.js');
}
