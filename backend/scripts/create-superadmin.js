const bcrypt = require('bcrypt');
const prisma = require('../prismaClient');

async function createSuperAdmin() {
  const email = process.env.SUPERADMIN_EMAIL || process.env.ADMIN_EMAIL;
  const password = process.env.SUPERADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
  const name = process.env.SUPERADMIN_NAME || 'SuperAdmin TiendaFast';
  const phone = process.env.SUPERADMIN_PHONE || '+584124742535';

  if (!email || !password) {
    console.error('❌ Error: Variables SUPERADMIN_EMAIL y SUPERADMIN_PASSWORD requeridas.');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('❌ Error: La contraseña de SuperAdmin debe tener al menos 8 caracteres.');
    process.exit(1);
  }

  try {
    const existing = await prisma.user.findFirst({
      where: { email }
    });

    const hashedPassword = await bcrypt.hash(password, 12);

    if (existing) {
      const updated = await prisma.user.update({
        where: { id: existing.id },
        data: {
          name,
          phone,
          password: hashedPassword,
          role: 'SUPERADMIN',
          failed_attempts: 0,
          locked_until: null
        }
      });
      console.log(`✅ SuperAdmin actualizado exitosamente: ${updated.email} (ID: ${updated.id})`);
    } else {
      const created = await prisma.user.create({
        data: {
          email,
          name,
          phone,
          password: hashedPassword,
          role: 'SUPERADMIN'
        }
      });
      console.log(`✅ SuperAdmin creado exitosamente: ${created.email} (ID: ${created.id})`);
    }
  } catch (error) {
    console.error('❌ Error al crear SuperAdmin:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();
