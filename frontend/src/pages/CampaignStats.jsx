
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, Send, Eye, AlertCircle, RefreshCw, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/ui/use-toast';

const CampaignStats = () => {
  const { id } = useParams();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
  }, [id]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/campaigns/${id}/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        throw new Error('Failed to fetch stats');
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('stats.errorFetch'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculatePercentage = (value, total) => {
    if (!total || total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  const cards = stats ? [
    { label: t('stats.total'), value: stats.total || 0, icon: Send, color: 'text-blue-500', bg: 'bg-blue-100', borderColor: 'border-blue-200' },
    { label: t('stats.delivered'), value: stats.delivered || 0, icon: CheckCircle, color: 'text-[#25d366]', bg: 'bg-[#dcf8c6]', borderColor: 'border-[#25d366]/30' },
    { label: t('stats.read'), value: stats.read || 0, icon: Eye, color: 'text-purple-500', bg: 'bg-purple-100', borderColor: 'border-purple-200' },
    { label: t('stats.failed'), value: stats.failed || 0, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-100', borderColor: 'border-red-200' },
  ] : [];

  return (
    <>
      <Helmet>
        <title>{t('stats.title')} - {t('nav.appName')}</title>
      </Helmet>
      
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
             <Link to="/campaigns">
              <Button variant="ghost" size="icon" className="text-[#075e54] hover:bg-[#dcf8c6]">
                <ArrowLeft className="w-5 h-5" />
              </Button>
             </Link>
            <div>
              <h1 className="text-3xl font-bold text-[#075e54]  mb-1 flex items-center gap-2">
                <BarChart2 className="w-8 h-8" />
                {t('stats.title')}
              </h1>
              <p className="text-[#128c7e] ">{t('stats.subtitle')}</p>
            </div>
          </div>
          <Button 
            onClick={fetchStats} 
            variant="outline" 
            className="gap-2 bg-white/90 text-[#075e54] border-[#075e54] hover:bg-[#25d366] hover:text-white hover:border-transparent"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {t('common.refresh')}
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
             [1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
             ))
          ) : (
            cards.map((card, index) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`bg-white rounded-xl p-6 shadow-sm border ${card.borderColor}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">{card.label}</p>
                      <h3 className="text-2xl font-bold text-[#075e54]">{card.value}</h3>
                    </div>
                    <div className={`p-3 rounded-full ${card.bg}`}>
                      <Icon className={`w-5 h-5 ${card.color}`} />
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Charts/Progress Section */}
        {!loading && stats && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-[#e9edef] p-8"
          >
            <h2 className="text-xl font-bold text-[#075e54] mb-6">Performance Overview</h2>
            
            <div className="space-y-6">
              {/* Delivery Rate */}
              <div>
                <div className="flex justify-between mb-2 text-sm font-medium">
                  <span className="text-[#075e54]">{t('stats.deliveryRate')}</span>
                  <span className="text-[#128c7e]">{calculatePercentage(stats.delivered, stats.total)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${calculatePercentage(stats.delivered, stats.total)}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="bg-[#25d366] h-3 rounded-full" 
                  />
                </div>
              </div>

              {/* Read Rate */}
              <div>
                <div className="flex justify-between mb-2 text-sm font-medium">
                  <span className="text-[#075e54]">{t('stats.readRate')}</span>
                  <span className="text-purple-600">{calculatePercentage(stats.read, stats.total)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${calculatePercentage(stats.read, stats.total)}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                    className="bg-purple-500 h-3 rounded-full" 
                  />
                </div>
              </div>

              {/* Failure Rate */}
              <div>
                <div className="flex justify-between mb-2 text-sm font-medium">
                  <span className="text-[#075e54]">Failure Rate</span>
                  <span className="text-red-500">{calculatePercentage(stats.failed, stats.total)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${calculatePercentage(stats.failed, stats.total)}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
                    className="bg-red-500 h-3 rounded-full" 
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
};

export default CampaignStats;
