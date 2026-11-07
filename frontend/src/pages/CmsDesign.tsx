import { useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { LandingSettings } from '../components/cms/LandingSettings';
import { AuthContext } from '../context/AuthContext';

export default function CmsDesign() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      navigate('/admin-login');
    }
  }, [user, navigate]);

  return (
    <AdminLayout title="Diseño y Landing Page">
      <div className="w-full max-w-[1750px] mx-auto space-y-4">
        <LandingSettings slug={slug || ''} />
      </div>
    </AdminLayout>
  );
}
