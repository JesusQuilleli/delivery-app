const prismaClient = require('../prismaClient');

const GRACE_PERIOD_DAYS = 5;

/**
 * Revisa el ciclo de vida de las suscripciones de todas las tiendas.
 * - TRIAL con trial_ends_at vencido -> PAST_DUE (o SUSPENDED si excede gracia)
 * - ACTIVE con next_billing_date vencido -> PAST_DUE (o SUSPENDED si excede gracia)
 * - PAST_DUE con fecha de vencimiento + GRACE_PERIOD_DAYS cumplida -> SUSPENDED y is_active = false
 *
 * @param {import('@prisma/client').PrismaClient} [prisma]
 * @param {Date} [now]
 * @returns {Promise<{ checked: number, updated: Array<{ id: number, name: string, from: string, to: string, reason: string }> }>}
 */
async function checkSubscriptionLifecycle(prisma = prismaClient, now = new Date()) {
  const stores = await prisma.store.findMany({
    where: {
      subscription_status: { in: ['TRIAL', 'ACTIVE', 'PAST_DUE'] }
    },
    select: {
      id: true,
      name: true,
      slug: true,
      subscription_status: true,
      trial_ends_at: true,
      next_billing_date: true,
      is_active: true
    }
  });

  const updates = [];
  const graceMs = GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000;

  for (const store of stores) {
    const status = store.subscription_status;
    let newStatus = null;
    let reason = null;
    let shouldDeactivate = false;

    if (status === 'TRIAL' && store.trial_ends_at) {
      const trialEnd = new Date(store.trial_ends_at);
      if (trialEnd < now) {
        const graceEnd = new Date(trialEnd.getTime() + graceMs);
        if (graceEnd < now) {
          newStatus = 'SUSPENDED';
          shouldDeactivate = true;
          reason = `Período de prueba vencido hace más de ${GRACE_PERIOD_DAYS} días`;
        } else {
          newStatus = 'PAST_DUE';
          reason = 'Período de prueba finalizado sin pago registrado';
        }
      }
    } else if (status === 'ACTIVE' && store.next_billing_date) {
      const billDate = new Date(store.next_billing_date);
      if (billDate < now) {
        const graceEnd = new Date(billDate.getTime() + graceMs);
        if (graceEnd < now) {
          newStatus = 'SUSPENDED';
          shouldDeactivate = true;
          reason = `Pago mensual vencido hace más de ${GRACE_PERIOD_DAYS} días`;
        } else {
          newStatus = 'PAST_DUE';
          reason = 'Fecha de facturación vencida sin pago registrado';
        }
      }
    } else if (status === 'PAST_DUE') {
      const referenceDate = store.next_billing_date 
        ? new Date(store.next_billing_date) 
        : (store.trial_ends_at ? new Date(store.trial_ends_at) : null);

      if (referenceDate) {
        const graceEnd = new Date(referenceDate.getTime() + graceMs);
        if (graceEnd < now) {
          newStatus = 'SUSPENDED';
          shouldDeactivate = true;
          reason = `Superado el período de gracia de ${GRACE_PERIOD_DAYS} días en mora`;
        }
      }
    }

    if (newStatus && newStatus !== status) {
      await prisma.store.update({
        where: { id: store.id },
        data: {
          subscription_status: newStatus,
          ...(shouldDeactivate ? { is_active: false } : {})
        }
      });

      console.log(`[SUBSCRIPTION_LIFECYCLE] Tienda '${store.name}' (ID: ${store.id}): ${status} -> ${newStatus}. ${reason}`);
      updates.push({
        id: store.id,
        name: store.name,
        slug: store.slug,
        from: status,
        to: newStatus,
        reason
      });
    }
  }

  return { checked: stores.length, updated: updates };
}

/**
 * Inicia el cron / intervalo de ciclo de vida de suscripciones en segundo plano.
 * @param {import('@prisma/client').PrismaClient} [prisma]
 * @param {number} [intervalMs] Por defecto cada 12 horas
 */
function startSubscriptionLifecycleJob(prisma = prismaClient, intervalMs = 12 * 60 * 60 * 1000) {
  // Ejecución inicial segura con retraso de 5 segundos para que la DB esté lista
  setTimeout(() => {
    checkSubscriptionLifecycle(prisma).catch(err => {
      console.warn('[SUBSCRIPTION_LIFECYCLE] Error en ejecución inicial:', err.message);
    });
  }, 5000);

  const timer = setInterval(() => {
    checkSubscriptionLifecycle(prisma).catch(err => {
      console.error('[SUBSCRIPTION_LIFECYCLE] Error en ciclo programado:', err.message);
    });
  }, intervalMs);

  if (timer.unref) {
    timer.unref();
  }

  return timer;
}

module.exports = {
  GRACE_PERIOD_DAYS,
  checkSubscriptionLifecycle,
  startSubscriptionLifecycleJob
};
