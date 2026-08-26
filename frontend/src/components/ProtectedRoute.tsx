import { useContext } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, token } = useContext(AuthContext);
  const { slug } = useParams<{ slug: string }>();

  if (!token || !user) {
    return <Navigate to="/admin-login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role || '')) {
    return <Navigate to="/admin-login" replace />;
  }

  if (slug && user.role === 'ADMIN' && user.store?.slug !== slug) {
    return <Navigate to="/admin-login" replace />;
  }

  return <>{children}</>;
}
