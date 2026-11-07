import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { X, AlertTriangle, Edit3, Trash2, Plus, Minus, ShoppingCart, Check } from 'lucide-react';
import { formatPrice } from '../utils/currency';

interface OrderItemData {
  product_id: number;
  quantity: number;
  unit_price: number | string;
  product?: {
    name: string;
    image_url?: string | null;
    price?: number | string;
  };
}

interface CancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  orderId: number;
}

const COMMON_REASONS = [
  'Deseo modificar o agregar productos',
  'Me equivoqué en la dirección de entrega',
  'Problema con el método de pago',
  'Demasiado tiempo de espera',
  'Otro motivo'
];

export const CancelOrderModal: React.FC<CancelModalProps> = ({ isOpen, onClose, onConfirm, orderId }) => {
  const [selectedReason, setSelectedReason] = useState<string>(COMMON_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    const finalReason = selectedReason === 'Otro motivo'
      ? (customReason.trim() || 'Cancelado por el cliente')
      : (customReason.trim() ? `${selectedReason} - ${customReason.trim()}` : selectedReason);
    
    setLoading(true);
    try {
      await onConfirm(finalReason);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-none relative space-y-6">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight">¿Deseas cancelar el pedido #{orderId}?</h3>
            <p className="text-xs text-gray-500 font-medium">Por favor indícanos el motivo de la cancelación:</p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase text-gray-500 tracking-wider">Motivo frecuente</label>
          <div className="flex flex-wrap gap-2">
            {COMMON_REASONS.map((reason) => (
              <button
                key={reason}
                type="button"
                onClick={() => setSelectedReason(reason)}
                className={`text-xs px-3 py-2 rounded-xl font-bold transition-all ${
                  selectedReason === reason
                    ? 'bg-red-600 text-white shadow-md shadow-red-500/20 scale-[1.02]'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {reason}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase text-gray-500 tracking-wider">Detalles adicionales (opcional)</label>
          <textarea
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            placeholder="Escribe alguna nota aclaratoria para el comercio..."
            rows={2}
            className="w-full text-sm p-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all resize-none"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-1/2 h-12 rounded-2xl font-bold text-gray-600 border-gray-200"
          >
            Volver
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="w-full sm:w-1/2 h-12 rounded-2xl font-black bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/25 transition-all"
          >
            {loading ? 'Cancelando...' : 'Confirmar Cancelación'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (items: { product_id: number; quantity: number }[]) => Promise<void>;
  onReloadToCart?: () => void;
  orderId: number;
  currency?: string;
  initialItems: OrderItemData[];
}

export const EditOrderModal: React.FC<EditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onReloadToCart,
  orderId,
  currency = 'USD',
  initialItems
}) => {
  const [items, setItems] = useState<OrderItemData[]>(initialItems);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  if (!isOpen) return null;

  const handleUpdateQty = (productId: number, delta: number) => {
    setItems((prev) =>
      prev
        .map((it) => {
          if (it.product_id === productId) {
            const nextQty = it.quantity + delta;
            return nextQty > 0 ? { ...it, quantity: nextQty } : null;
          }
          return it;
        })
        .filter(Boolean) as OrderItemData[]
    );
  };

  const handleRemove = (productId: number) => {
    setItems((prev) => prev.filter((it) => it.product_id !== productId));
  };

  const subtotal = items.reduce((sum, it) => {
    const price = Number(it.unit_price) || 0;
    return sum + price * it.quantity;
  }, 0);

  const handleSave = async () => {
    if (items.length === 0) return;
    setLoading(true);
    try {
      await onSave(items.map((it) => ({ product_id: it.product_id, quantity: it.quantity })));
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-none relative space-y-6 max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
            <Edit3 size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight">Editar Pedido #{orderId}</h3>
            <p className="text-xs text-gray-500 font-medium">Modifica cantidades o elimina productos antes del despacho:</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm font-bold">No quedan productos en el pedido.</p>
              <p className="text-xs mt-1">Si no deseas ningún producto, cancela el pedido.</p>
            </div>
          ) : (
            items.map((it) => (
              <div
                key={it.product_id}
                className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100"
              >
                <div className="min-w-0 pr-3">
                  <p className="font-black text-sm text-gray-900 truncate">
                    {it.product?.name || `Producto #${it.product_id}`}
                  </p>
                  <p className="text-xs font-semibold text-gray-500">
                    {formatPrice(Number(it.unit_price), currency)} c/u
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex items-center border border-gray-200 rounded-xl bg-white overflow-hidden shadow-xs">
                    <button
                      type="button"
                      onClick={() => handleUpdateQty(it.product_id, -1)}
                      className="p-1.5 text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-7 text-center font-black text-xs text-gray-900">{it.quantity}</span>
                    <button
                      type="button"
                      onClick={() => handleUpdateQty(it.product_id, 1)}
                      className="p-1.5 text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(it.product_id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-3 border-t border-gray-100 space-y-3">
          <div className="flex justify-between items-center text-sm font-black text-gray-900">
            <span>Nuevo Subtotal:</span>
            <span className="text-lg text-emerald-600">{formatPrice(subtotal, currency)}</span>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              type="button"
              onClick={handleSave}
              disabled={loading || items.length === 0}
              className="w-full h-12 rounded-2xl font-black bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-lg shadow-emerald-500/25 transition-all"
            >
              <Check size={18} className="mr-2" />
              {loading ? 'Guardando...' : 'Guardar Cambios en el Pedido'}
            </Button>

            {onReloadToCart && (
              <Button
                type="button"
                variant="outline"
                onClick={onReloadToCart}
                disabled={loading}
                className="w-full h-11 rounded-2xl font-bold text-gray-700 border-gray-200 hover:bg-gray-50 text-xs"
              >
                <ShoppingCart size={15} className="mr-2 text-primary" />
                Cargar productos al Carrito y volver al Catálogo
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
