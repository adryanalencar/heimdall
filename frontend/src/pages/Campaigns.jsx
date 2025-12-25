
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Plus, Play, Pause, RefreshCw, Clock, CheckCircle, XCircle, BarChart2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/lib/i18n';

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [connections, setConnections] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    message_body: '',
    media_url: '',
    media_type: 'image',
    messages_per_minute: 10,
    contact_list_id: '',
    target_tags_ids: [],
    connection_id: '',
  });
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    fetchCampaigns();
    fetchConnections();
    fetchTags();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/campaigns');
      const data = await response.json();
      setCampaigns(Array.isArray(data) ? data : []);
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('campaigns.errorFetch'),
        variant: 'destructive',
      });
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchConnections = async () => {
    try {
      const response = await fetch('http://localhost:8000/connections');
      const data = await response.json();
      setConnections(Array.isArray(data) ? data : []);
    } catch (error) {
      setConnections([]);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch('http://localhost:8000/tags');
      const data = await response.json();
      setTags(Array.isArray(data) ? data : []);
    } catch (error) {
      setTags([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      
      if (!payload.contact_list_id) delete payload.contact_list_id;
      if (!payload.media_url) {
        delete payload.media_url;
        delete payload.media_type;
      }

      const response = await fetch('http://localhost:8000/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          status: 'draft',
        }),
      });

      if (response.ok) {
        toast({
          title: t('common.success'),
          description: t('campaigns.successCreate'),
        });
        setFormData({
          name: '',
          message_body: '',
          media_url: '',
          media_type: 'image',
          messages_per_minute: 10,
          contact_list_id: '',
          target_tags_ids: [],
          connection_id: '',
        });
        fetchCampaigns();
      } else {
        throw new Error('Failed to create campaign');
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('campaigns.errorCreate'),
        variant: 'destructive',
      });
    }
  };

  const handleStartCampaign = async (id) => {
    try {
      const response = await fetch(`http://localhost:8000/campaigns/${id}/start`, {
        method: 'POST',
      });

      if (response.ok) {
        toast({
          title: t('common.success'),
          description: t('campaigns.successStart'),
        });
        fetchCampaigns();
      } else {
        throw new Error('Failed to start campaign');
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('campaigns.errorStart'),
        variant: 'destructive',
      });
    }
  };

  const handlePauseCampaign = async (id) => {
    try {
      const response = await fetch(`http://localhost:8000/campaigns/${id}/pause`, {
        method: 'POST',
      });

      if (response.ok) {
        toast({
          title: t('common.success'),
          description: t('campaigns.successPause'),
        });
        fetchCampaigns();
      } else {
        throw new Error('Failed to pause campaign');
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('campaigns.errorPause'),
        variant: 'destructive',
      });
    }
  };

  const toggleTag = (tagId) => {
    setFormData((prev) => ({
      ...prev,
      target_tags_ids: prev.target_tags_ids.includes(tagId)
        ? prev.target_tags_ids.filter((t) => t !== tagId)
        : [...prev.target_tags_ids, tagId],
    }));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running':
        return <Play className="w-4 h-4 text-[#25d366]" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'paused':
        return <Pause className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running':
        return 'bg-[#dcf8c6] text-[#075e54] border-[#25d366]';
      case 'completed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'paused':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-500 border-gray-200';
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('campaigns.title')} - {t('nav.appName')}</title>
        <meta name="description" content={t('campaigns.subtitle')} />
      </Helmet>
      <div className="space-y-8">
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h1 className="text-3xl font-bold text-[#075e54]  mb-2">{t('campaigns.title')}</h1>
            <p className="text-[#128c7e] ">{t('campaigns.subtitle')}</p>
          </div>
          <Button onClick={fetchCampaigns} variant="outline" className="gap-2 bg-white/90 text-[#075e54] border-[#075e54] hover:bg-[#25d366] hover:text-white hover:border-transparent">
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
          <h2 className="text-xl font-bold text-[#075e54] mb-4 flex items-center gap-2 pb-4 border-b border-[#e9edef]">
            <Plus className="w-5 h-5 text-[#25d366]" />
            {t('campaigns.createNew')}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="campaignName" className="text-[#075e54]">{t('campaigns.name')} {t('common.required')}</Label>
                <Input
                  id="campaignName"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Summer Sale 2024"
                  required
                  className="bg-gray-50 border-gray-200 text-[#075e54] focus:ring-[#128c7e] focus:border-[#128c7e]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="connection" className="text-[#075e54]">{t('campaigns.connection')} {t('common.required')}</Label>
                <select
                  id="connection"
                  value={formData.connection_id}
                  onChange={(e) => setFormData({ ...formData, connection_id: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-[#075e54] focus:ring-[#128c7e] focus:border-[#128c7e] focus:outline-none"
                >
                  <option value="">{t('campaigns.selectConnection')}</option>
                  {connections.map((conn) => (
                    <option key={conn.id} value={conn.id}>
                      {conn.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="messages_per_minute" className="text-[#075e54]">{t('campaigns.msgsPerMin')}</Label>
                <Input
                  id="messages_per_minute"
                  type="number"
                  min="1"
                  max="60"
                  value={formData.messages_per_minute}
                  onChange={(e) => setFormData({ ...formData, messages_per_minute: parseInt(e.target.value) || 10 })}
                  placeholder="10"
                  className="bg-gray-50 border-gray-200 text-[#075e54] focus:ring-[#128c7e] focus:border-[#128c7e]"
                />
              </div>
               <div className="space-y-2">
                <Label htmlFor="media_url" className="text-[#075e54]">{t('campaigns.mediaUrl')} {t('common.optional')}</Label>
                <Input
                  id="media_url"
                  value={formData.media_url}
                  onChange={(e) => setFormData({ ...formData, media_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="bg-gray-50 border-gray-200 text-[#075e54] focus:ring-[#128c7e] focus:border-[#128c7e]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message_body" className="text-[#075e54]">{t('campaigns.messageBody')} {t('common.required')}</Label>
              <Textarea
                id="message_body"
                value={formData.message_body}
                onChange={(e) => setFormData({ ...formData, message_body: e.target.value })}
                placeholder="Hello! Check out our amazing summer deals..."
                required
                rows={4}
                className="bg-gray-50 border-gray-200 text-[#075e54] focus:ring-[#128c7e] focus:border-[#128c7e] resize-none"
              />
            </div>

            {tags.length > 0 && (
              <div className="space-y-2">
                <Label className="text-[#075e54]">{t('campaigns.targetTags')} {t('common.optional')}</Label>
                <div className="flex gap-2 flex-wrap">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                        formData.target_tags_ids.includes(tag.id)
                          ? 'ring-2 ring-white text-white bg-[#075e54]'
                          : 'text-[#075e54] hover:bg-[#dcf8c6] bg-gray-100'
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <Button type="submit" className="w-full md:w-auto bg-[#25d366] hover:bg-[#128c7e] text-white font-semibold">
              <Plus className="w-4 h-4 mr-2" />
              {t('campaigns.createBtn')}
            </Button>
          </form>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white shadow-sm border border-[#e9edef] rounded-xl p-6"
        >
          <h2 className="text-xl font-bold text-[#075e54] mb-4 pb-4 border-b border-[#e9edef]">{t('campaigns.allCampaigns')}</h2>
          {loading ? (
            <div className="text-center py-8 text-gray-500">{t('common.loading')}</div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-8 text-gray-400">{t('campaigns.noCampaigns')}</div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign, index) => (
                <motion.div
                  key={campaign.id || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="p-5 bg-gray-50 rounded-lg hover:bg-[#f0f2f5] transition-colors border border-gray-100"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-[#075e54]">{campaign.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(campaign.status)}`}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(campaign.status)}
                            {t(`campaigns.status.${campaign.status}`) || campaign.status || t('campaigns.status.draft')}
                          </div>
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{campaign.message_body}</p>
                      {campaign.target_tags_ids && campaign.target_tags_ids.length > 0 && (
                        <div className="flex gap-1 mb-2">
                          {campaign.target_tags_ids.map((tagId) => {
                            const tag = tags.find((t) => t.id === tagId);
                            return tag ? (
                              <span
                                key={tagId}
                                className="px-2 py-0.5 rounded-full text-xs text-[#075e54] bg-[#dcf8c6]"
                              >
                                {tag.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}
                      {campaign.media_url && (
                        <div className="text-xs text-gray-400 mt-2 truncate max-w-md">
                          Media: {campaign.media_url}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 md:self-start">
                       <Link to={`/campaigns/${campaign.id}/stats`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2 border-blue-300 text-blue-600 hover:bg-blue-50"
                        >
                          <BarChart2 className="w-4 h-4" />
                          {t('campaigns.stats')}
                        </Button>
                      </Link>
                      <Link to={`/campaigns/${campaign.id}/logs`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2 border-gray-300 text-gray-600 hover:bg-gray-100"
                        >
                          <FileText className="w-4 h-4" />
                          {t('campaigns.logs')}
                        </Button>
                      </Link>
                      {campaign.status === 'running' ? (
                        <Button
                          onClick={() => handlePauseCampaign(campaign.id)}
                          size="sm"
                          variant="outline"
                          className="gap-2 border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                        >
                          <Pause className="w-4 h-4" />
                          {t('campaigns.pause')}
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleStartCampaign(campaign.id)}
                          size="sm"
                          className="gap-2 bg-[#25d366] hover:bg-[#128c7e] text-white"
                        >
                          <Play className="w-4 h-4" />
                          {t('campaigns.start')}
                        </Button>
                      )}
                    </div>
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

export default Campaigns;
