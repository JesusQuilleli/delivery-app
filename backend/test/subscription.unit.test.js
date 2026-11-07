const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { checkSubscriptionLifecycle, GRACE_PERIOD_DAYS } = require('../services/subscriptionService');

describe('Subscription Lifecycle (Unit)', () => {
  const baseNow = new Date('2026-11-07T12:00:00Z');

  it('no modifica tiendas en TRIAL con fecha de prueba en el futuro', async () => {
    const mockStore = {
      id: 1,
      name: 'Tienda Nueva',
      slug: 'tienda-nueva',
      subscription_status: 'TRIAL',
      trial_ends_at: new Date('2026-11-20T12:00:00Z'),
      next_billing_date: null,
      is_active: true
    };

    let updatedCalled = false;
    const mockPrisma = {
      store: {
        findMany: async () => [mockStore],
        update: async () => { updatedCalled = true; }
      }
    };

    const res = await checkSubscriptionLifecycle(mockPrisma, baseNow);
    assert.equal(res.checked, 1);
    assert.equal(res.updated.length, 0);
    assert.equal(updatedCalled, false);
  });

  it('cambia TRIAL a PAST_DUE si trial_ends_at venció recientemente dentro del período de gracia', async () => {
    const mockStore = {
      id: 2,
      name: 'Farma Test',
      slug: 'farma-test',
      subscription_status: 'TRIAL',
      trial_ends_at: new Date('2026-11-06T12:00:00Z'), // Venció ayer (hace 1 día)
      next_billing_date: null,
      is_active: true
    };

    let updatedData = null;
    const mockPrisma = {
      store: {
        findMany: async () => [mockStore],
        update: async ({ where, data }) => {
          assert.equal(where.id, 2);
          updatedData = data;
        }
      }
    };

    const res = await checkSubscriptionLifecycle(mockPrisma, baseNow);
    assert.equal(res.checked, 1);
    assert.equal(res.updated.length, 1);
    assert.equal(res.updated[0].from, 'TRIAL');
    assert.equal(res.updated[0].to, 'PAST_DUE');
    assert.equal(updatedData.subscription_status, 'PAST_DUE');
    // Dentro de gracia no desactiva la tienda todavía
    assert.equal(updatedData.is_active, undefined);
  });

  it('cambia ACTIVE a PAST_DUE si next_billing_date venció dentro del período de gracia', async () => {
    const mockStore = {
      id: 3,
      name: 'Burger King Local',
      slug: 'burger-local',
      subscription_status: 'ACTIVE',
      trial_ends_at: null,
      next_billing_date: new Date('2026-11-05T12:00:00Z'), // Venció hace 2 días
      is_active: true
    };

    let updatedData = null;
    const mockPrisma = {
      store: {
        findMany: async () => [mockStore],
        update: async ({ data }) => {
          updatedData = data;
        }
      }
    };

    const res = await checkSubscriptionLifecycle(mockPrisma, baseNow);
    assert.equal(res.updated.length, 1);
    assert.equal(res.updated[0].from, 'ACTIVE');
    assert.equal(res.updated[0].to, 'PAST_DUE');
    assert.equal(updatedData.subscription_status, 'PAST_DUE');
  });

  it('suspende y desactiva tienda si superó el período de gracia (GRACE_PERIOD_DAYS = 5)', async () => {
    const mockStore = {
      id: 4,
      name: 'Bodegón Moroso',
      slug: 'bodegon-moroso',
      subscription_status: 'PAST_DUE',
      trial_ends_at: null,
      next_billing_date: new Date('2026-10-25T12:00:00Z'), // Venció hace 13 días (> 5 días)
      is_active: true
    };

    let updatedData = null;
    const mockPrisma = {
      store: {
        findMany: async () => [mockStore],
        update: async ({ data }) => {
          updatedData = data;
        }
      }
    };

    const res = await checkSubscriptionLifecycle(mockPrisma, baseNow);
    assert.equal(res.updated.length, 1);
    assert.equal(res.updated[0].from, 'PAST_DUE');
    assert.equal(res.updated[0].to, 'SUSPENDED');
    assert.equal(updatedData.subscription_status, 'SUSPENDED');
    assert.equal(updatedData.is_active, false);
  });

  it('suspende directamente un TRIAL vencido hace más de 10 días', async () => {
    const mockStore = {
      id: 5,
      name: 'Antigua Farmacia',
      slug: 'antigua-farmacia',
      subscription_status: 'TRIAL',
      trial_ends_at: new Date('2026-10-20T12:00:00Z'), // Venció hace 18 días
      next_billing_date: null,
      is_active: true
    };

    let updatedData = null;
    const mockPrisma = {
      store: {
        findMany: async () => [mockStore],
        update: async ({ data }) => {
          updatedData = data;
        }
      }
    };

    const res = await checkSubscriptionLifecycle(mockPrisma, baseNow);
    assert.equal(res.updated.length, 1);
    assert.equal(res.updated[0].from, 'TRIAL');
    assert.equal(res.updated[0].to, 'SUSPENDED');
    assert.equal(updatedData.subscription_status, 'SUSPENDED');
    assert.equal(updatedData.is_active, false);
  });
});
