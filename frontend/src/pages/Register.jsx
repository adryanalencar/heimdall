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

const Register = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(formData),
      }, { auth: false });

      if (!response.ok) {
        throw new Error('Register failed');
      }

      const loginResponse = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: formData.email, password: formData.password }),
      }, { auth: false });

      if (!loginResponse.ok) {
        throw new Error('Login failed');
      }

      const loginData = await loginResponse.json();
      setToken(loginData.access_token);
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('auth.registerError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#ece5dd] flex items-center justify-center px-4">
      <Helmet>
        <title>{t('auth.registerTitle')} - {t('nav.appName')}</title>
      </Helmet>
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-md border border-[#e9edef] p-8">
        <h1 className="text-2xl font-bold text-[#075e54] mb-2">{t('auth.registerTitle')}</h1>
        <p className="text-sm text-gray-500 mb-6">{t('auth.registerSubtitle')}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name" className="text-[#075e54]">{t('auth.firstName')}</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(event) => setFormData({ ...formData, first_name: event.target.value })}
                placeholder="João"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name" className="text-[#075e54]">{t('auth.lastName')}</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(event) => setFormData({ ...formData, last_name: event.target.value })}
                placeholder="Silva"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-[#075e54]">{t('auth.phone')}</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
              placeholder="+55 11 99999-9999"
              required
            />
          </div>
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
            {loading ? t('auth.loading') : t('auth.registerButton')}
          </Button>
        </form>
        <p className="text-sm text-gray-500 mt-6 text-center">
          {t('auth.hasAccount')}{' '}
          <Link to="/login" className="text-[#075e54] font-semibold hover:underline">
            {t('auth.signIn')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
