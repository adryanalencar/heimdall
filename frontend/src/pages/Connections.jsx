
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Plus, Trash2, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/lib/i18n';

const Connections = () => {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    api_url: '',
    api_key: '',
    instance_name: '',
  });
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/connections');
      const data = await response.json();
      setConnections(Array.isArray(data) ? data : []);
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('connections.errorFetch'),
        variant: 'destructive',
      });
      setConnections([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: t('common.success'),
          description: t('connections.successCreate'),
        });
        setFormData({ name: '', api_url: '', api_key: '', instance_name: '' });
        fetchConnections();
      } else {
        throw new Error('Failed to create connection');
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('connections.errorCreate'),
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://localhost:8000/connections/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: t('common.success'),
          description: t('connections.successDelete'),
        });
        fetchConnections();
      } else {
        throw new Error('Failed to delete connection');
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('connections.errorDelete'),
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('connections.title')} - {t('nav.appName')}</title>
        <meta name="description" content={t('connections.subtitle')} />
      </Helmet>
      <div className="space-y-8">
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h1 className="text-3xl font-bold text-[#075e54]  mb-2">{t('connections.title')}</h1>
            <p className="text-[#128c7e] ">{t('connections.subtitle')}</p>
          </div>
          <Button onClick={fetchConnections} variant="outline" className="gap-2 bg-white/90 text-[#075e54] border-[#075e54] hover:bg-[#25d366] hover:text-white hover:border-transparent">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {t('common.refresh')}
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white shadow-sm border border-[#e9edef] rounded-xl p-6"
        >
          <h2 className="text-xl font-bold text-[#075e54] mb-6 flex items-center gap-2 pb-4 border-b border-[#e9edef]">
            <Plus className="w-5 h-5 text-[#25d366]" />
            {t('connections.createNew')}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[#075e54]">{t('connections.name')}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="My WhatsApp Business"
                  required
                  className="bg-gray-50 border-gray-200 text-[#075e54] focus:ring-[#128c7e] focus:border-[#128c7e]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instance_name" className="text-[#075e54]">{t('connections.instanceName')}</Label>
                <Input
                  id="instance_name"
                  value={formData.instance_name}
                  onChange={(e) => setFormData({ ...formData, instance_name: e.target.value })}
                  placeholder="instance_1"
                  required
                  className="bg-gray-50 border-gray-200 text-[#075e54] focus:ring-[#128c7e] focus:border-[#128c7e]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="api_url" className="text-[#075e54]">{t('connections.apiUrl')}</Label>
                <Input
                  id="api_url"
                  value={formData.api_url}
                  onChange={(e) => setFormData({ ...formData, api_url: e.target.value })}
                  placeholder="https://api.example.com"
                  required
                  className="bg-gray-50 border-gray-200 text-[#075e54] focus:ring-[#128c7e] focus:border-[#128c7e]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="api_key" className="text-[#075e54]">{t('connections.apiKey')}</Label>
                <Input
                  id="api_key"
                  type="password"
                  value={formData.api_key}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                  placeholder="your-api-key"
                  required
                  className="bg-gray-50 border-gray-200 text-[#075e54] focus:ring-[#128c7e] focus:border-[#128c7e]"
                />
              </div>
            </div>
            <Button type="submit" className="w-full md:w-auto bg-[#25d366] hover:bg-[#128c7e] text-white font-semibold">
              <Plus className="w-4 h-4 mr-2" />
              {t('connections.createBtn')}
            </Button>
          </form>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white shadow-sm border border-[#e9edef] rounded-xl p-6"
        >
          <h2 className="text-xl font-bold text-[#075e54] mb-4 pb-4 border-b border-[#e9edef]">{t('connections.activeTitle')}</h2>
          {loading ? (
            <div className="text-center py-8 text-gray-500">{t('common.loading')}</div>
          ) : connections.length === 0 ? (
            <div className="text-center py-8 text-gray-400">{t('connections.noConnections')}</div>
          ) : (
            <div className="space-y-3">
              {connections.map((connection, index) => (
                <motion.div
                  key={connection.id || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-[#f0f2f5] transition-colors border border-gray-100"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${connection.connected ? 'bg-[#25d366]' : 'bg-red-400'}`} />
                    <div>
                      <div className="font-semibold text-[#075e54]">{connection.name}</div>
                      <div className="text-sm text-gray-500">{connection.instance_name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {connection.connected ? (
                      <div className="flex items-center gap-2 text-[#25d366] text-sm font-medium">
                        <CheckCircle className="w-4 h-4" />
                        {t('common.connected')}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-500 text-sm font-medium">
                        <XCircle className="w-4 h-4" />
                        {t('common.disconnected')}
                      </div>
                    )}
                    <Button
                      onClick={() => handleDelete(connection.id)}
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
};

export default Connections;
