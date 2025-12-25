import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw, FileText, Search, User, Phone, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/ui/use-toast';

const CampaignLogs = () => {
  const { id } = useParams();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useTranslation();
  const { toast } = useToast();

  useEffect(() => {
    fetchLogs();
  }, [id]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/campaigns/${id}/logs`);
      if (response.ok) {
        const data = await response.json();
        setLogs(Array.isArray(data) ? data : []);
      } else {
        throw new Error('Failed to fetch logs');
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('logs.errorFetch'),
        variant: 'destructive',
      });
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (number) => {
    if (!number) return '-';
    return number.split('@')[0];
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };

  const filteredLogs = logs.filter(log => 
    (log.contact_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.contact_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.status || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    let classes = "bg-gray-100 text-gray-600 border-gray-200";
    let label = status;

    switch(status?.toLowerCase()) {
      case 'sent':
      case 'delivered':
        classes = "bg-[#dcf8c6] text-[#075e54] border-[#25d366]";
        break;
      case 'read':
        classes = "bg-purple-100 text-purple-700 border-purple-200";
        break;
      case 'failed':
        classes = "bg-red-100 text-red-700 border-red-200";
        break;
      case 'processing':
        classes = "bg-yellow-100 text-yellow-700 border-yellow-200";
        break;
      default:
        classes = "bg-gray-100 text-gray-600 border-gray-200";
    }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${classes} inline-flex items-center gap-1`}>
        {label}
      </span>
    );
  };

  return (
    <>
      <Helmet>
        <title>{t('logs.title')} - {t('nav.appName')}</title>
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
              <h1 className="text-3xl font-bold text-[#075e54] mb-1 flex items-center gap-2">
                <FileText className="w-8 h-8" />
                {t('logs.title')}
              </h1>
              <p className="text-[#128c7e]">{t('logs.subtitle')}</p>
            </div>
          </div>
          <Button 
            onClick={fetchLogs} 
            variant="outline" 
            className="gap-2 bg-white/90 text-[#075e54] border-[#075e54] hover:bg-[#25d366] hover:text-white hover:border-transparent"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {t('common.refresh')}
          </Button>
        </div>

        {/* Search and Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-xl shadow-sm border border-[#e9edef] overflow-hidden"
        >
          {/* Toolbar */}
          <div className="p-4 border-b border-[#e9edef] flex items-center gap-4 bg-gray-50">
             <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  placeholder="Search name, number or status..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-white border-gray-200 focus:border-[#128c7e] focus:ring-[#128c7e]"
                />
             </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-[#e9edef] text-gray-500 text-sm uppercase">
                  <th className="px-6 py-4 font-semibold">Contact Name</th>
                  <th className="px-6 py-4 font-semibold">Contact Number</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Error Message</th>
                  <th className="px-6 py-4 font-semibold">Created At</th>
                </tr>
              </thead>
              <tbody className="text-gray-700 text-sm">
                {loading ? (
                   <tr>
                     <td colSpan="5" className="px-6 py-8 text-center text-gray-500">{t('common.loading')}</td>
                   </tr>
                ) : filteredLogs.length === 0 ? (
                   <tr>
                     <td colSpan="5" className="px-6 py-8 text-center text-gray-500">{t('logs.noLogs')}</td>
                   </tr>
                ) : (
                  filteredLogs.map((log, index) => (
                    <tr key={index} className="border-b border-[#e9edef] hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          {log.contact_name || 'Unknown'}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-gray-600">
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3 text-gray-400" />
                          {formatPhoneNumber(log.contact_number)}
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(log.status)}</td>
                      <td className="px-6 py-4">
                        {log.error_message ? (
                          <div className="flex items-center gap-1 text-red-500 max-w-[200px]" title={log.error_message}>
                            <AlertCircle className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{log.error_message}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                         <div className="flex items-center gap-2">
                           <Clock className="w-3 h-3 text-gray-400" />
                           {formatDate(log.created_at)}
                         </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default CampaignLogs;