import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { XCircle } from 'lucide-react';

interface RejectOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReject: (reason: string) => void;
  orderId: number;
}

export default function RejectOrderDialog({ open, onOpenChange, onReject, orderId }: RejectOrderDialogProps) {
  const [reason, setReason] = useState('');

  const handleReject = () => {
    onReject(reason);
    setReason('');
  };

  const handleClose = () => {
    setReason('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <XCircle size={24} /> Rechazar Pedido #{orderId}
          </DialogTitle>
          <DialogDescription>
            Indica el motivo del rechazo. El cliente será notificado.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="Ej: Producto sin stock, dirección no alcanzable..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="min-h-[100px]"
          autoFocus
        />
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          <Button variant="destructive" onClick={handleReject} className="font-bold">
            Rechazar Pedido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
