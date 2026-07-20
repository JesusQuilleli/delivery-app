# 🚀 Plataforma Delivery Multitenant (Beta v1.0)

Bienvenido al repositorio de la plataforma de Delivery y Gestión de Inventario. Este proyecto está diseñado para alojar múltiples negocios (Farmacias, Repuestos, Comida, etc.) desde una única base de datos y servidor, brindando a cada tienda su propia identidad y panel de administración independiente.

## ✨ Funcionalidades Principales

*   **Arquitectura Multitenant:** Una sola instancia del código maneja infinitas tiendas aisladas mediante URLs únicas (ej: `/farmacia-ayacucho`).
*   **Multi-Moneda Dinámico (En tiempo real):** Integración nativa con la API del **Banco Central de Venezuela (BCV)** y **DólarAPI**. El administrador carga los productos en USD y la plataforma calcula en milisegundos los precios en Bolívares y Pesos Colombianos para el cliente.
*   **WebSockets (Socket.io):** Alertas visuales y sonoras en tiempo real para nuevos pedidos y actualizaciones de inventario sin recargar la página.
*   **Inventario Ultra Optimizado:** Carga diferida (Lazy Loading) y paginación por pestaña en el panel administrativo, permitiendo manejar decenas de miles de productos sin pérdida de rendimiento. Búsqueda *Fuzzy* del lado del servidor.
*   **Gestión de Combos:** Creación de promociones uniendo productos individuales del almacén, restando stock inteligentemente.
*   **Mapa GPS Interactivo:** Los administradores pueden fijar la ubicación exacta de su local en un mapa interactivo.

## 🛠️ Stack Tecnológico

**Frontend:**
*   React.js 18 + TypeScript
*   Vite (Bundler ultra rápido)
*   TailwindCSS + shadcn/ui (Diseño moderno, Glassmorphism)
*   Zustand / Context API (Estado Global)
*   React-Leaflet (Mapas Interactivos)

**Backend:**
*   Node.js + Express.js
*   Prisma ORM (Interacción con DB)
*   PostgreSQL (Base de Datos Relacional)
*   Socket.io (Comunicación bidireccional)
*   Cloudinary (Almacenamiento de Imágenes)
*   JWT (Autenticación)

## 📦 Instalación y Ejecución Local

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/JesusQuilleli/delivery-app.git
    cd delivery-app
    ```

2.  **Configurar Variables de Entorno:**
    *   Crea un archivo `.env` dentro de la carpeta `backend/`.
    *   Copia la estructura (puedes basarte en un `.env.example` si existe) y coloca tus claves de PostgreSQL, Cloudinary, etc.

3.  **Iniciar Backend:**
    ```bash
    cd backend
    npm install
    npx prisma migrate dev
    npm run dev
    ```

4.  **Iniciar Frontend:**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

## 📝 Documentación Comercial
Si deseas ver las funcionalidades desde una perspectiva de negocio (para presentaciones a clientes o ventas), por favor revisa el archivo `Brochure_Comercial.md` incluido en la raíz de este proyecto.
