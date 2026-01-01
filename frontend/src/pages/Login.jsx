import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { apiFetch } from '@/lib/api';
import { setToken } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify(formData),
      }, { auth: false });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      setToken(data.access_token);
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('auth.loginError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#ece5dd] flex items-center justify-center px-4">
      <Helmet>
        <title>{t('auth.loginTitle')} - {t('nav.appName')}</title>
      </Helmet>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md border border-[#e9edef] p-8">
        <h1 className="text-2xl font-bold text-[#075e54] mb-2">{t('auth.loginTitle')}</h1>
        <p className="text-sm text-gray-500 mb-6">{t('auth.loginSubtitle')}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[#075e54]">{t('auth.email')}</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(event) => setFormData({ ...formData, email: event.target.value })}
              placeholder="email@exemplo.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-[#075e54]">{t('auth.password')}</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(event) => setFormData({ ...formData, password: event.target.value })}
              placeholder="••••••••"
              required
            />
          </div>
          <Button type="submit" className="w-full bg-[#25d366] hover:bg-[#128c7e] text-white" disabled={loading}>
            {loading ? t('auth.loading') : t('auth.loginButton')}
          </Button>
        </form>
        <p className="text-sm text-gray-500 mt-6 text-center">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="text-[#075e54] font-semibold hover:underline">
            {t('auth.createAccount')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
