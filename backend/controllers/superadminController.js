const prisma = require('../prismaClient');
const bcrypt = require('bcrypt');
const { getPlan, PLANS } = require('../config/plans');

const DEFAULT_CATEGORIES_BY_INDUSTRY = {
  PHARMACY: ['Medicamentos', 'Cuidado Personal', 'Primeros Auxilios'],
  RESTAURANT: ['Comida Rápida', 'Bebidas', 'Combos'],
  SUPERMARKET: ['Víveres', 'Bebidas', 'Limpieza y Hogar']
};

const getStores = async (req, res) => {
  try {
    const stores = await prisma.store.findMany({
      include: {
        users: {
          where: { role: 'ADMIN' },
          select: { username: true, name: true, phone: true }
        },
        _count: {
          select: { orders: true, products: true }
        }
      },
      orderBy: { id: 'desc' }
    });
    res.json(stores);
  } catch (error) {
    console.error('Error fetching stores:', error);
    res.status(500).json({ error: 'Error obteniendo tiendas' });
  }
};

const createStore = async (req, res) => {
  try {
    const {
      storeName,
      slug,
      adminUsername,
      adminPassword,
      adminPhone,
      industry,
      theme_color,
      plan: requestedPlan,
      trialDays = 30
    } = req.body;
    
    if (!storeName || !slug || !adminUsername || !adminPassword || !adminPhone) {
      return res.status(400).json({ error: 'Faltan campos obligatorios: nombre, slug, usuario, contraseña y teléfono son requeridos.' });
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      return res.status(400).json({ error: 'El slug solo puede contener letras minúsculas, números y guiones.' });
    }

    if (adminPassword.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    // Check if slug exists
    const existingStore = await prisma.store.findUnique({ where: { slug } });
    if (existingStore) return res.status(400).json({ error: 'El slug o URL ya está en uso' });
    
    const existingUser = await prisma.user.findUnique({
      where: { username: adminUsername }
    });
    if (existingUser) return res.status(400).json({ error: 'El usuario ya existe' });

    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const selectedPlan = getPlan(requestedPlan);
    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + Number(trialDays) * 24 * 60 * 60 * 1000);

    const result = await prisma.$transaction(async (tx) => {
      const store = await tx.store.create({
        data: {
          name: storeName,
          slug,
          is_active: true,
          industry: industry || 'PHARMACY',
          theme_color: theme_color || 'blue',
          plan: selectedPlan.code,
          plan_price: selectedPlan.priceUSD,
          billing_cycle: 'MONTHLY',
          subscription_status: 'TRIAL',
          trial_ends_at: trialEndsAt,
          next_billing_date: trialEndsAt
        }
      });

      const admin = await tx.user.create({
        data: {
          store_id: store.id,
          username: adminUsername,
          password: hashedPassword,
          phone: adminPhone,
          name: 'Admin ' + storeName,
          role: 'ADMIN'
        }
      });

      // Asistente de alta (F2B-07): inicializar categorías sugeridas por industria
      const initialCategoryNames = DEFAULT_CATEGORIES_BY_INDUSTRY[store.industry] || DEFAULT_CATEGORIES_BY_INDUSTRY.PHARMACY;
      await tx.category.createMany({
        data: initialCategoryNames.map(name => ({
          name,
          store_id: store.id
        }))
      });

      return { store, admin };
    });

    res.json({ message: 'Tienda y catálogo inicial creados exitosamente', data: result });
  } catch (error) {
    console.error('Error creating store:', error);
    res.status(500).json({ error: 'Error creando la tienda y el administrador' });
  }
};

const toggleStoreStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};
    const store = await prisma.store.findUnique({ where: { id: Number(id) } });
    if (!store) return res.status(404).json({ error: 'Tienda no encontrada' });

    const updated = await prisma.store.update({
      where: { id: Number(id) },
      data: { is_active: !store.is_active }
    });

    const actor = req.user?.username || req.user?.name || 'SUPERADMIN';
    const action = updated.is_active ? 'STORE_ACTIVATED' : 'STORE_DEACTIVATED';
    const auditRecord = {
      store_id: store.id,
      store_slug: store.slug,
      store_name: store.name,
      previous_status: store.is_active,
      new_status: updated.is_active,
      action,
      actor,
      reason: typeof reason === 'string' && reason.trim() ? reason.trim() : null,
      timestamp: new Date().toISOString()
    };

    console.log(`[AUDIT] ${action}: Tienda '${store.name}' (ID: ${store.id}, Slug: '${store.slug}') cambiada a ${updated.is_active ? 'ACTIVA' : 'INACTIVA'} por ${actor}. Razón: ${auditRecord.reason || 'No especificada'}. Fecha: ${auditRecord.timestamp}`);

    res.json({
      message: `Tienda ${updated.is_active ? 'activada' : 'desactivada'} exitosamente`,
      is_active: updated.is_active,
      audit: auditRecord
    });
  } catch (error) {
    console.error('Error actualizando estado de tienda:', error);
    res.status(500).json({ error: 'Error actualizando estado de tienda' });
  }
};

// F2B-03 & F2B-09: Panel de Suscripciones SaaS y Métricas MRR
const getSubscriptions = async (req, res) => {
  try {
    const stores = await prisma.store.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        is_active: true,
        industry: true,
        plan: true,
        plan_price: true,
        billing_cycle: true,
        subscription_status: true,
        trial_ends_at: true,
        next_billing_date: true,
        subscription_notes: true,
        _count: {
          select: { products: true, orders: true }
        },
        users: {
          where: { role: 'ADMIN' },
          select: { id: true, username: true, phone: true }
        },
        subscriptionPayments: {
          orderBy: { created_at: 'desc' },
          take: 1
        }
      },
      orderBy: { id: 'desc' }
    });

    let mrr = 0;
    let activeCount = 0;
    let trialCount = 0;
    let pastDueCount = 0;
    let suspendedCount = 0;

    const formattedStores = stores.map(store => {
      const planInfo = getPlan(store.plan);
      const price = Number(store.plan_price || planInfo.priceUSD);
      
      // Cálculo de MRR mensual
      const monthlyContribution = store.billing_cycle === 'ANNUAL' ? price / 12 : price;
      if (store.subscription_status === 'ACTIVE') {
        mrr += monthlyContribution;
        activeCount++;
      } else if (store.subscription_status === 'TRIAL') {
        trialCount++;
      } else if (store.subscription_status === 'PAST_DUE') {
        pastDueCount++;
      } else if (store.subscription_status === 'SUSPENDED' || !store.is_active) {
        suspendedCount++;
      }

      return {
        ...store,
        plan_price: price,
        plan_details: planInfo,
        product_usage: {
          current: store._count.products,
          limit: planInfo.maxProducts,
          percentage: Math.min(100, Math.round((store._count.products / planInfo.maxProducts) * 100))
        },
        last_payment: store.subscriptionPayments?.[0] || null
      };
    });

    res.json({
      summary: {
        mrr: Number(mrr.toFixed(2)),
        activeCount,
        trialCount,
        pastDueCount,
        suspendedCount,
        totalStores: stores.length
      },
      stores: formattedStores,
      available_plans: Object.values(PLANS)
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ error: 'Error obteniendo métricas y suscripciones SaaS' });
  }
};

// F2B-04 & F2B-10: Actualizar Plan / Estado de Suscripción con Auditoría
const updateStoreSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      plan,
      plan_price,
      billing_cycle,
      subscription_status,
      trial_ends_at,
      next_billing_date,
      subscription_notes,
      reason
    } = req.body;

    const store = await prisma.store.findUnique({ where: { id: Number(id) } });
    if (!store) return res.status(404).json({ error: 'Tienda no encontrada' });

    const updateData = {};
    if (plan !== undefined) {
      const planConfig = getPlan(plan);
      updateData.plan = planConfig.code;
      if (plan_price === undefined) {
        updateData.plan_price = planConfig.priceUSD;
      }
    }
    if (plan_price !== undefined) updateData.plan_price = Number(plan_price);
    if (billing_cycle !== undefined) updateData.billing_cycle = billing_cycle;
    if (subscription_status !== undefined) {
      updateData.subscription_status = subscription_status;
      // Si se suspende, pausar la tienda
      if (subscription_status === 'SUSPENDED') {
        updateData.is_active = false;
      } else if (subscription_status === 'ACTIVE') {
        updateData.is_active = true;
      }
    }
    if (trial_ends_at !== undefined) updateData.trial_ends_at = trial_ends_at ? new Date(trial_ends_at) : null;
    if (next_billing_date !== undefined) updateData.next_billing_date = next_billing_date ? new Date(next_billing_date) : null;
    if (subscription_notes !== undefined) updateData.subscription_notes = subscription_notes;

    const updated = await prisma.store.update({
      where: { id: Number(id) },
      data: updateData
    });

    const actor = req.user?.username || req.user?.name || 'SUPERADMIN';
    const auditRecord = {
      action: 'SUBSCRIPTION_UPDATED',
      actor,
      store_id: store.id,
      store_slug: store.slug,
      previous_plan: store.plan,
      new_plan: updated.plan,
      previous_status: store.subscription_status,
      new_status: updated.subscription_status,
      reason: reason || 'Actualización administrativa de suscripción',
      timestamp: new Date().toISOString()
    };

    console.log(`[AUDIT] SUBSCRIPTION_UPDATED: Tienda '${store.name}' (ID: ${store.id}). Plan: ${store.plan} -> ${updated.plan}. Estado: ${store.subscription_status} -> ${updated.subscription_status}. Por: ${actor}. Razón: ${auditRecord.reason}`);

    res.json({
      message: 'Suscripción actualizada exitosamente',
      store: updated,
      audit: auditRecord
    });
  } catch (error) {
    console.error('Error updating store subscription:', error);
    res.status(500).json({ error: 'Error actualizando suscripción de la tienda' });
  }
};

// F2B-02 & F2B-04: Registrar Pago de Suscripción
const recordSubscriptionPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      amount,
      currency = 'USD',
      payment_method = 'PAGO_MOVIL',
      payment_reference,
      period_start,
      period_end,
      notes
    } = req.body;

    if (!amount || !period_start || !period_end) {
      return res.status(400).json({ error: 'Monto, fecha inicio y fecha fin de período son requeridos.' });
    }

    const store = await prisma.store.findUnique({ where: { id: Number(id) } });
    if (!store) return res.status(404).json({ error: 'Tienda no encontrada' });

    const actor = req.user?.username || req.user?.name || 'SUPERADMIN';

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.subscriptionPayment.create({
        data: {
          store_id: store.id,
          amount: Number(amount),
          currency,
          payment_method,
          payment_reference: payment_reference ? String(payment_reference).trim() : null,
          period_start: new Date(period_start),
          period_end: new Date(period_end),
          status: 'APPROVED',
          notes: notes || null,
          recorded_by: actor
        }
      });

      const updatedStore = await tx.store.update({
        where: { id: store.id },
        data: {
          subscription_status: 'ACTIVE',
          is_active: true,
          next_billing_date: new Date(period_end)
        }
      });

      return { payment, updatedStore };
    });

    console.log(`[AUDIT] SUBSCRIPTION_PAYMENT_RECORDED: Pago de ${amount} ${currency} registrado para tienda '${store.name}' (ID: ${store.id}) por ${actor}. Próximo cobro: ${period_end}`);

    res.json({
      message: 'Pago de suscripción registrado exitosamente',
      payment: result.payment,
      store: result.updatedStore
    });
  } catch (error) {
    console.error('Error recording subscription payment:', error);
    res.status(500).json({ error: 'Error registrando el pago de la suscripción' });
  }
};

// Obtener historial de pagos de una tienda
const getStorePayments = async (req, res) => {
  try {
    const { id } = req.params;
    const payments = await prisma.subscriptionPayment.findMany({
      where: { store_id: Number(id) },
      orderBy: { created_at: 'desc' }
    });
    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Error obteniendo historial de pagos' });
  }
};

const { checkSubscriptionLifecycle } = require('../services/subscriptionService');

const triggerSubscriptionLifecycleCheck = async (req, res) => {
  try {
    const result = await checkSubscriptionLifecycle(prisma);
    res.json({
      success: true,
      message: Revisión completada.  tiendas analizadas,  actualizadas.,
      ...result
    });
  } catch (error) {
    console.error('Error checking subscription lifecycle:', error);
    res.status(500).json({ error: 'Error ejecutando ciclo de vida de suscripciones' });
  }
};

// F2G-03: Reseteo rápido de contraseña de administrador de tienda por el SuperAdmin
const resetStoreAdminPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const store = await prisma.store.findUnique({
      where: { id: Number(id) },
      include: {
        users: {
          where: { role: 'ADMIN' },
          take: 1
        }
      }
    });

    if (!store) {
      return res.status(404).json({ error: 'Tienda no encontrada' });
    }

    const adminUser = store.users[0];
    if (!adminUser) {
      return res.status(404).json({ error: 'La tienda no tiene un usuario administrador asociado' });
    }

    // Generar contraseña temporal segura: Fast2026-XXXX
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const temporaryPassword = `Fast2026-${randomSuffix}`;
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    await prisma.user.update({
      where: { id: adminUser.id },
      data: { password: hashedPassword }
    });

    const actor = req.user?.username || 'SuperAdmin';
    console.log(`[AUDIT] ADMIN_PASSWORD_RESET: Tienda '${store.name}' (ID: ${store.id}). Usuario: '${adminUser.username}'. Por: ${actor}`);

    res.json({
      success: true,
      message: `Contraseña restablecida exitosamente para '${adminUser.username}'.`,
      store_id: store.id,
      store_name: store.name,
      slug: store.slug,
      admin_username: adminUser.username,
      admin_phone: adminUser.phone || store.whatsapp || '',
      temporary_password: temporaryPassword
    });
  } catch (error) {
    console.error('Error resetting store admin password:', error);
    res.status(500).json({ error: 'Error al restablecer la contraseña del administrador' });
  }
};

module.exports = {
  resetStoreAdminPassword,
  triggerSubscriptionLifecycleCheck,
  getStores,
  createStore,
  toggleStoreStatus,
  getSubscriptions,
  updateStoreSubscription,
  recordSubscriptionPayment,
  getStorePayments
};
