
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link2, Tag, Users, Megaphone, TrendingUp, Activity } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

const Dashboard = () => {
  const [stats, setStats] = useState({
    connections: 0,
    tags: 0,
    contacts: 0,
    campaigns: 0,
  });
  const { t } = useTranslation();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [connectionsRes, tagsRes, contactsRes, campaignsRes] = await Promise.all([
        fetch('http://localhost:8000/connections').catch(() => ({ json: async () => [] })),
        fetch('http://localhost:8000/tags').catch(() => ({ json: async () => [] })),
        fetch('http://localhost:8000/contacts').catch(() => ({ json: async () => [] })),
        fetch('http://localhost:8000/campaigns').catch(() => ({ json: async () => [] })),
      ]);

      const connections = await connectionsRes.json();
      const tags = await tagsRes.json();
      const contacts = await contactsRes.json();
      const campaigns = await campaignsRes.json();

      setStats({
        connections: Array.isArray(connections) ? connections.length : 0,
        tags: Array.isArray(tags) ? tags.length : 0,
        contacts: Array.isArray(contacts) ? contacts.length : 0,
        campaigns: Array.isArray(campaigns) ? campaigns.length : 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const statCards = [
    { label: t('nav.connections'), value: stats.connections, icon: Link2, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: t('nav.tags'), value: stats.tags, icon: Tag, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: t('nav.contacts'), value: stats.contacts, icon: Users, color: 'text-[#075e54]', bg: 'bg-[#dcf8c6]' },
    { label: t('nav.campaigns'), value: stats.campaigns, icon: Megaphone, color: 'text-orange-600', bg: 'bg-orange-100' },
  ];

  return (
    <>
      <Helmet>
        <title>{t('dashboard.title')} - {t('nav.appName')}</title>
        <meta name="description" content={t('dashboard.subtitle')} />
      </Helmet>
      <div className="space-y-8">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-[#075e54]  mb-2 shadow-sm">{t('dashboard.title')}</h1>
          <p className="text-[#128c7e] ">{t('dashboard.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="relative overflow-hidden rounded-xl bg-white shadow-sm border border-[#e9edef] p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-full ${card.bg}`}>
                     <Icon className={`w-6 h-6 ${card.color}`} />
                  </div>
                  <TrendingUp className="w-4 h-4 text-[#25d366]" />
                </div>
                <div className="text-3xl font-bold text-[#075e54] mb-1">{card.value}</div>
                <div className="text-sm text-gray-500 font-medium">{card.label}</div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="bg-white shadow-sm border border-[#e9edef] rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#e9edef]">
            <Activity className="w-6 h-6 text-[#128c7e]" />
            <h2 className="text-xl font-bold text-[#075e54]">{t('dashboard.quickActions')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <a href="/connections" className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-[#dcf8c6] hover:scale-[1.02] transition-all border border-transparent hover:border-[#25d366]">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                 <Link2 className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-sm font-semibold text-[#075e54]">{t('dashboard.manageConnections')}</div>
            </a>
            <a href="/tags" className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-[#dcf8c6] hover:scale-[1.02] transition-all border border-transparent hover:border-[#25d366]">
              <div className="p-2 bg-purple-100 rounded-lg mr-3">
                 <Tag className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-sm font-semibold text-[#075e54]">{t('dashboard.createTags')}</div>
            </a>
            <a href="/contacts" className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-[#dcf8c6] hover:scale-[1.02] transition-all border border-transparent hover:border-[#25d366]">
              <div className="p-2 bg-green-100 rounded-lg mr-3">
                 <Users className="w-5 h-5 text-[#075e54]" />
              </div>
              <div className="text-sm font-semibold text-[#075e54]">{t('dashboard.addContacts')}</div>
            </a>
            <a href="/campaigns" className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-[#dcf8c6] hover:scale-[1.02] transition-all border border-transparent hover:border-[#25d366]">
              <div className="p-2 bg-orange-100 rounded-lg mr-3">
                 <Megaphone className="w-5 h-5 text-orange-600" />
              </div>
              <div className="text-sm font-semibold text-[#075e54]">{t('dashboard.startCampaign')}</div>
            </a>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default Dashboard;
