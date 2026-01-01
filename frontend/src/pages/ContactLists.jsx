import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ClipboardList, Plus, RefreshCw, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/lib/i18n';
import { apiFetch } from '@/lib/api';

const ContactLists = () => {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedListId, setExpandedListId] = useState(null);
  const [listDetails, setListDetails] = useState({});
  const [formData, setFormData] = useState({ name: '' });
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    setLoading(true);
    try {
      const response = await apiFetch('/lists');
      const data = await response.json();
      setLists(Array.isArray(data) ? data : []);
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('lists.errorFetch'),
        variant: 'destructive',
      });
      setLists([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchListDetails = async (listId) => {
    try {
      const response = await apiFetch(`/lists/${listId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch list details');
      }
      const data = await response.json();
      setListDetails((prev) => ({ ...prev, [listId]: data }));
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('lists.errorFetchContacts'),
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await apiFetch('/lists', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: t('common.success'),
          description: t('lists.successCreate'),
        });
        setFormData({ name: '' });
        fetchLists();
      } else {
        throw new Error('Failed to create list');
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('lists.errorCreate'),
        variant: 'destructive',
      });
    }
  };

  const toggleListDetails = async (listId) => {
    if (expandedListId === listId) {
      setExpandedListId(null);
      return;
    }
    setExpandedListId(listId);
    if (!listDetails[listId]) {
      await fetchListDetails(listId);
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('lists.title')} - {t('nav.appName')}</title>
        <meta name="description" content={t('lists.subtitle')} />
      </Helmet>
      <div className="space-y-8">
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h1 className="text-3xl font-bold text-[#075e54] mb-2">{t('lists.title')}</h1>
            <p className="text-[#128c7e]">{t('lists.subtitle')}</p>
          </div>
          <Button
            onClick={fetchLists}
            variant="outline"
            className="gap-2 bg-white/90 text-[#075e54] border-[#075e54] hover:bg-[#25d366] hover:text-white hover:border-transparent"
          >
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
            <ClipboardList className="w-5 h-5 text-[#25d366]" />
            {t('lists.createTitle')}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="listName" className="text-[#075e54]">{t('lists.name')}</Label>
              <Input
                id="listName"
                value={formData.name}
                onChange={(event) => setFormData({ name: event.target.value })}
                placeholder={t('lists.namePlaceholder')}
                required
                className="bg-gray-50 border-gray-200 text-[#075e54] focus:ring-[#128c7e] focus:border-[#128c7e]"
              />
            </div>
            <Button type="submit" className="w-full md:w-auto bg-[#25d366] hover:bg-[#128c7e] text-white font-semibold">
              <Plus className="w-4 h-4 mr-2" />
              {t('lists.createBtn')}
            </Button>
          </form>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white shadow-sm border border-[#e9edef] rounded-xl p-6"
        >
          <h2 className="text-xl font-bold text-[#075e54] mb-4 pb-4 border-b border-[#e9edef]">{t('lists.allLists')}</h2>
          {loading ? (
            <div className="text-center py-8 text-gray-500">{t('common.loading')}</div>
          ) : lists.length === 0 ? (
            <div className="text-center py-8 text-gray-400">{t('lists.noLists')}</div>
          ) : (
            <div className="space-y-4">
              {lists.map((list) => {
                const details = listDetails[list.id];
                const isExpanded = expandedListId === list.id;
                const contacts = details?.contacts || [];
                return (
                  <motion.div
                    key={list.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="p-5 bg-gray-50 rounded-lg hover:bg-[#f0f2f5] transition-colors border border-gray-100"
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-[#075e54]">{list.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {t('lists.totalContacts', { count: contacts.length })}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="gap-2 border-[#075e54] text-[#075e54] hover:bg-[#dcf8c6]"
                        onClick={() => toggleListDetails(list.id)}
                      >
                        <Users className="w-4 h-4" />
                        {isExpanded ? t('lists.hideContacts') : t('lists.viewContacts')}
                      </Button>
                    </div>
                    {isExpanded && (
                      <div className="mt-4 border-t border-gray-200 pt-4 space-y-2">
                        {contacts.length === 0 ? (
                          <p className="text-sm text-gray-400">{t('lists.noContacts')}</p>
                        ) : (
                          <ul className="space-y-2">
                            {contacts.map((contact) => (
                              <li key={contact.id} className="flex items-center justify-between text-sm text-[#075e54]">
                                <span className="font-medium">{contact.name}</span>
                                <span className="text-gray-500">{contact.number}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
};

export default ContactLists;
