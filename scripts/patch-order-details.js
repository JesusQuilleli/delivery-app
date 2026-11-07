const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../frontend/src/pages/OrderDetails.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const isCrlf = content.includes('\r\n');
let normalized = content.replace(/\r\n/g, '\n');

// 1. Replace manual buttons with automatic dispatch notification card
const targetButtons = `                <a
                  href={driverWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1da851] text-white p-3.5 md:p-4 rounded-xl font-black mt-4 transition-transform hover:scale-[1.02] shadow-xl shadow-green-500/20 text-base md:text-lg"
                >
                  <Truck size={22} /> Enviar Ruta al Motorizado
                </a>
                
                {order.status === 'DISPATCHED' && order.driver && (
                  <a
                    href={\`https://api.whatsapp.com/send?phone=\${order.user.phone.replace('+', '')}&text=\${encodeURIComponent(\`¡Hola \${order.user.name || ''}! 👋 Tu pedido acaba de salir y va en camino. 🛵\\n\\nTu motorizado es *\${order.driver.name}* (Placa: \${order.driver.vehicle_plate || 'N/A'}).\\nPuedes contactarlo al: \${order.driver.phone}\`)}\`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white p-3.5 md:p-4 rounded-xl font-black mt-3 transition-transform hover:scale-[1.02] shadow-xl shadow-blue-500/20 text-base md:text-lg"
                  >
                    <Phone size={22} /> Notificar Cliente por WhatsApp
                  </a>
                )}`;

const replacementButtons = `                {order.status === 'DISPATCHED' ? (
                  <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl shadow-sm space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-emerald-600 text-white rounded-xl shrink-0 mt-0.5 shadow-sm">
                        <CheckCircle size={20} />
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-sm text-emerald-950">Despacho Notificado Automáticamente</p>
                        <p className="text-xs text-emerald-800 font-medium mt-0.5">
                          Se disparó la notificación automática de WhatsApp al cliente y al motorizado con todos los detalles y la ruta de entrega.
                        </p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-emerald-200/60 flex flex-wrap gap-2">
                      <a
                        href={driverWhatsAppUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-100/60 text-emerald-800 border border-emerald-300 rounded-xl font-bold text-xs transition-colors shadow-xs"
                      >
                        <Truck size={14} /> Reenviar a Motorizado
                      </a>
                      <a
                        href={\`https://api.whatsapp.com/send?phone=\${order.user.phone.replace(/\\D/g, '')}&text=\${encodeURIComponent(\`¡Hola \${order.user.name || ''}! 👋 Tu pedido #\${order.id} va en camino. 🛵\\n\\nTu repartidor asignado es *\${order.driver?.name || 'Asignado'}*\${order.driver?.phone ? \` (\${order.driver.phone})\` : ''}.\`)}\`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-blue-100/60 text-blue-800 border border-blue-300 rounded-xl font-bold text-xs transition-colors shadow-xs"
                      >
                        <Phone size={14} /> Reenviar a Cliente
                      </a>
                    </div>
                  </div>
                ) : (
                  <a
                    href={driverWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1da851] text-white p-3.5 md:p-4 rounded-xl font-black mt-4 transition-transform hover:scale-[1.02] shadow-xl shadow-green-500/20 text-base md:text-lg"
                  >
                    <Truck size={22} /> Compartir Ruta con Motorizado
                  </a>
                )}`;

if (!normalized.includes(targetButtons)) {
  console.error('Target buttons not found in OrderDetails.tsx');
  process.exit(1);
}
normalized = normalized.replace(targetButtons, replacementButtons);

// 2. Replace modal with elevated z-[100], responsive container and clear buttons
const targetModal = `      {/* Driver Selection Modal */}
      {showDriverModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-black text-gray-900">Seleccionar Motorizado</h3>
                <button onClick={() => setShowDriverModal(false)} className="text-gray-400 hover:text-gray-600">
                  <XCircle size={20} />
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-4 font-medium">Asigna un motorizado de tu flota para llevar este pedido.</p>
              
              <select 
                value={selectedDriverId} 
                onChange={(e) => setSelectedDriverId(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50 font-medium mb-6 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                <option value="" disabled>-- Elige un motorizado --</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>{d.name} {d.vehicle_plate ? \`(\${d.vehicle_plate})\` : ''}</option>
                ))}
              </select>

              <div className="flex gap-2">
                <Button onClick={() => changeStatus('DISPATCHED')} variant="outline" className="flex-1 font-bold">Omitir (Sin asigar)</Button>
                <Button 
                  onClick={() => selectedDriverId && changeStatus('DISPATCHED', Number(selectedDriverId))} 
                  disabled={!selectedDriverId}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-black"
                >
                  Asignar y Despachar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}`;

const replacementModal = `      {/* Driver Selection Modal - Mobile Responsive & Elevated z-[100] */}
      {showDriverModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[100] flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 max-h-[92vh] flex flex-col">
            <div className="p-5 md:p-6 overflow-y-auto">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
                    <Truck size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-black text-gray-950">Despachar Pedido</h3>
                    <p className="text-xs text-gray-500 font-semibold">Asigna un repartidor de tu flota</p>
                  </div>
                </div>
                <button onClick={() => setShowDriverModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
                  <XCircle size={22} />
                </button>
              </div>

              <div className="my-4">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-2">
                  Motorizado / Repartidor
                </label>
                <select 
                  value={selectedDriverId} 
                  onChange={(e) => setSelectedDriverId(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-xl p-3.5 bg-gray-50 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
                >
                  <option value="" disabled>-- Selecciona un motorizado --</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>{d.name} {d.phone ? \`(\${d.phone})\` : ''} {d.vehicle_plate ? \`[\${d.vehicle_plate}]\` : ''}</option>
                  ))}
                </select>
                {drivers.length === 0 && (
                  <p className="text-xs text-amber-600 mt-2 font-medium">
                    ⚠️ No tienes motorizados registrados en tu flota. Puedes despachar sin asignar o registrar uno en Ajustes.
                  </p>
                )}
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-xs text-purple-900 font-medium mb-5">
                ⚡ <span className="font-bold">Aviso Automático:</span> Al despachar, el cliente y el motorizado recibirán automáticamente un WhatsApp con los datos del pedido y la ruta.
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <Button 
                  onClick={() => changeStatus('DISPATCHED')} 
                  variant="outline" 
                  className="order-2 sm:order-1 sm:w-1/2 font-bold h-12 text-sm border-gray-300 hover:bg-gray-100"
                >
                  Despachar sin Asignar
                </Button>
                <Button 
                  onClick={() => selectedDriverId && changeStatus('DISPATCHED', Number(selectedDriverId))} 
                  disabled={!selectedDriverId}
                  className="order-1 sm:order-2 sm:w-1/2 bg-purple-600 hover:bg-purple-700 text-white font-black h-12 text-sm shadow-md shadow-purple-600/30 disabled:opacity-50"
                >
                  Asignar y Despachar 🚀
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}`;

if (!normalized.includes(targetModal)) {
  console.error('Target modal not found in OrderDetails.tsx');
  process.exit(1);
}
normalized = normalized.replace(targetModal, replacementModal);

const finalContent = isCrlf ? normalized.replace(/\n/g, '\r\n') : normalized;
fs.writeFileSync(filePath, finalContent, 'utf8');
console.log('Successfully updated OrderDetails.tsx with mobile responsive modal and automatic dispatch confirmation!');
