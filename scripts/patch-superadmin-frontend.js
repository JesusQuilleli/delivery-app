const fs = require('fs');

const path = 'frontend/src/pages/SuperAdmin.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. In handleCreateStore, add adminEmail to payload and improve toast
const oldPayload = `      await api.post('/superadmin/stores', {
        storeName,
        slug,
        adminUsername,
        adminPhone,
        adminPassword,
        industry,
        theme_color: themeColor,
        plan: selectedPlan,
        trialDays: Number(trialDays)
      });
      toast.success('Tienda y catálogo inicial creados exitosamente.');`.replace(/\n/g, '\r\n');

const newPayload = `      await api.post('/superadmin/stores', {
        storeName,
        slug,
        adminUsername,
        adminEmail,
        adminPhone,
        adminPassword,
        industry,
        theme_color: themeColor,
        plan: selectedPlan,
        trialDays: Number(trialDays)
      });
      toast.success('¡Tienda creada exitosamente! Credenciales de acceso despachadas al correo del dueño.');`.replace(/\n/g, '\r\n');

if (content.includes(oldPayload)) {
  content = content.replace(oldPayload, newPayload);
  console.log('Patched handleCreateStore payload');
} else {
  console.warn('oldPayload not found');
}

// 2. Add input field for adminEmail under Cuenta de Administración
const oldFormUser = `                  <div className="space-y-1.5">
                    <Label className="font-bold text-gray-700 text-xs">Usuario</Label>
                    <Input required value={adminUsername} onChange={(e) => setAdminUsername(e.target.value)} placeholder="admin_tienda" className="h-10 bg-gray-50" />
                  </div>`.replace(/\n/g, '\r\n');

const newFormUserAndEmail = `                  <div className="space-y-1.5">
                    <Label className="font-bold text-gray-700 text-xs">Usuario</Label>
                    <Input required value={adminUsername} onChange={(e) => setAdminUsername(e.target.value)} placeholder="admin_tienda" className="h-10 bg-gray-50" />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="font-bold text-gray-700 text-xs flex items-center gap-1.5 text-emerald-800">
                      <Mail size={14} className="text-emerald-600" /> Correo Electrónico del Dueño (Para credenciales)
                    </Label>
                    <Input 
                      required 
                      type="email" 
                      value={adminEmail} 
                      onChange={(e) => setAdminEmail(e.target.value)} 
                      placeholder="dueno@negocio.com" 
                      className="h-10 bg-emerald-50/40 border-emerald-300 focus:border-emerald-500 font-medium" 
                    />
                    <p className="text-[11px] text-gray-500">Al registrarse, recibirá automáticamente sus credenciales, URL de acceso y detalles del plan.</p>
                  </div>`.replace(/\n/g, '\r\n');

if (content.includes(oldFormUser)) {
  content = content.replace(oldFormUser, newFormUserAndEmail);
  console.log('Patched adminEmail input field');
} else {
  console.warn('oldFormUser not found');
}

// 3. Sanitize adminPhone to auto-strip leading 0
const oldPhoneInput = `                  <div className="space-y-1.5">
                    <Label className="font-bold text-gray-700 text-xs">Teléfono (WhatsApp)</Label>
                    <Input required value={adminPhone} onChange={(e) => setAdminPhone(e.target.value)} placeholder="+584141234567" className="h-10 bg-gray-50" />
                  </div>`.replace(/\n/g, '\r\n');

const newPhoneInput = `                  <div className="space-y-1.5">
                    <Label className="font-bold text-gray-700 text-xs">Teléfono (WhatsApp)</Label>
                    <Input 
                      required 
                      value={adminPhone} 
                      onChange={(e) => {
                        const clean = e.target.value.replace(/\\D/g, '').replace(/^0+/, '');
                        setAdminPhone(clean.startsWith('58') ? '+' + clean : '+58' + clean);
                      }} 
                      placeholder="+584141234567" 
                      className="h-10 bg-gray-50" 
                    />
                  </div>`.replace(/\n/g, '\r\n');

if (content.includes(oldPhoneInput)) {
  content = content.replace(oldPhoneInput, newPhoneInput);
  console.log('Patched adminPhone input field');
} else {
  console.warn('oldPhoneInput not found');
}

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully written SuperAdmin.tsx');
