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
import MyOrders from './pages/MyOrders';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import ProductDetails from './pages/ProductDetails';
import Settings from './pages/Settings';
import SuperAdmin from './pages/SuperAdmin';
import { Toaster } from 'sonner';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/superadmin" element={<SuperAdmin />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/admin/:slug" element={<Dashboard />} />
            <Route path="/admin/:slug/history" element={<OrderHistory />} />
            <Route path="/admin/:slug/order/:orderId" element={<OrderDetails />} />
            <Route path="/admin/:slug/inventory" element={<Inventory />} />
            <Route path="/admin/:slug/customers" element={<Customers />} />
            <Route path="/admin/:slug/settings" element={<Settings />} />

            <Route path="/:slug" element={<Landing />} />

            {/* Rutas del Cliente (Envueltas en Layout) */}
            <Route element={<Layout />}>
              <Route path="/:slug/productos" element={<Catalog />} />
              <Route path="/:slug/categorias/:categoryId" element={<Catalog />} />
              <Route path="/:slug/productos/:productId" element={<ProductDetails />} />
              <Route path="/:slug/checkout" element={<Checkout />} />
              <Route path="/:slug/mis-pedidos" element={<MyOrders />} />
            </Route>

            <Route path="/" element={<Navigate to="/farmacia-ayacucho" />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-center" richColors />
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
