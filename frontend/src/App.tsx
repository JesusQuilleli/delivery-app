import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Catalog from './pages/Catalog';
import Checkout from './pages/Checkout';
import Dashboard from './pages/Dashboard';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

import AdminLogin from './pages/AdminLogin';
import OrderHistory from './pages/OrderHistory';
import OrderDetails from './pages/OrderDetails';
import Inventory from './pages/Inventory';
import Customers from './pages/Customers';
import Drivers from './pages/Drivers';
import MyOrders from './pages/MyOrders';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import ProductDetails from './pages/ProductDetails';
import Settings from './pages/Settings';
import SuperAdmin from './pages/SuperAdmin';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from 'sonner';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/superadmin" element={<ProtectedRoute allowedRoles={['SUPERADMIN']}><SuperAdmin /></ProtectedRoute>} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/admin/:slug" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPERADMIN']}><Dashboard /></ProtectedRoute>} />
            <Route path="/admin/:slug/history" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPERADMIN']}><OrderHistory /></ProtectedRoute>} />
            <Route path="/admin/:slug/order/:orderId" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPERADMIN']}><OrderDetails /></ProtectedRoute>} />
            <Route path="/admin/:slug/inventory" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPERADMIN']}><Inventory /></ProtectedRoute>} />
            <Route path="/admin/:slug/customers" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPERADMIN']}><Customers /></ProtectedRoute>} />
            <Route path="/admin/:slug/drivers" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPERADMIN']}><Drivers /></ProtectedRoute>} />
            <Route path="/admin/:slug/settings" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPERADMIN']}><Settings /></ProtectedRoute>} />

            <Route path="/:slug" element={<Landing />} />

            <Route element={<Layout />}>
              <Route path="/:slug/productos" element={<Catalog />} />
              <Route path="/:slug/categorias/:categoryId" element={<Catalog />} />
              <Route path="/:slug/productos/:productId" element={<ProductDetails />} />
              <Route path="/:slug/checkout" element={<Checkout />} />
              <Route path="/:slug/mis-pedidos" element={<MyOrders />} />
            </Route>

            <Route path="/" element={<Navigate to="/demo-farmacia" />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-center" richColors />
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
