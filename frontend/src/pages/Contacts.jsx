
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Plus, Trash2, RefreshCw, User, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/lib/i18n';

const Contacts = () => {
  const [contacts, setContacts] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    number: '',
    tag_ids: [],
  });
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    fetchContacts();
    fetchTags();
  }, []);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/contacts');
      const data = await response.json();
      setContacts(Array.isArray(data) ? data : []);
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('contacts.errorFetch'),
        variant: 'destructive',
      });
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch('http://localhost:8000/tags');
      const data = await response.json();
      setTags(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch tags');
      setTags([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: t('common.success'),
          description: t('contacts.successCreate'),
        });
        setFormData({ name: '', number: '', tag_ids: [] });
        fetchContacts();
      } else {
        throw new Error('Failed to create contact');
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('contacts.errorCreate'),
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://localhost:8000/contacts/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: t('common.success'),
          description: t('contacts.successDelete'),
        });
        fetchContacts();
      } else {
        throw new Error('Failed to delete contact');
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('contacts.errorDelete'),
        variant: 'destructive',
      });
    }
  };

  const toggleTag = (tagId) => {
    setFormData((prev) => ({
      ...prev,
      tag_ids: prev.tag_ids.includes(tagId)
        ? prev.tag_ids.filter((t) => t !== tagId)
        : [...prev.tag_ids, tagId],
    }));
  };

  return (
    <>
      <Helmet>
        <title>{t('contacts.title')} - {t('nav.appName')}</title>
        <meta name="description" content={t('contacts.subtitle')} />
      </Helmet>
      <div className="space-y-8">
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h1 className="text-3xl font-bold text-[#075e54]  mb-2">{t('contacts.title')}</h1>
            <p className="text-[#128c7e] ">{t('contacts.subtitle')}</p>
          </div>
          <Button onClick={fetchContacts} variant="outline" className="gap-2 bg-white/90 text-[#075e54] border-[#075e54] hover:bg-[#25d366] hover:text-white hover:border-transparent">
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
            {t('contacts.addNew')}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactName" className="text-[#075e54]">{t('contacts.name')}</Label>
                <Input
                  id="contactName"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  required
                  className="bg-gray-50 border-gray-200 text-[#075e54] focus:ring-[#128c7e] focus:border-[#128c7e]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone" className="text-[#075e54]">{t('contacts.phone')}</Label>
                <Input
                  id="contactPhone"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  placeholder="+1234567890"
                  required
                  className="bg-gray-50 border-gray-200 text-[#075e54] focus:ring-[#128c7e] focus:border-[#128c7e]"
                />
              </div>
            </div>
            {tags.length > 0 && (
              <div className="space-y-2">
                <Label className="text-[#075e54]">{t('contacts.tags')} {t('common.optional')}</Label>
                <div className="flex gap-2 flex-wrap">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                        formData.tag_ids.includes(tag.id)
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
              {t('contacts.addBtn')}
            </Button>
          </form>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white shadow-sm border border-[#e9edef] rounded-xl p-6"
        >
          <h2 className="text-xl font-bold text-[#075e54] mb-4 pb-4 border-b border-[#e9edef]">{t('contacts.allContacts')}</h2>
          {loading ? (
            <div className="text-center py-8 text-gray-500">{t('common.loading')}</div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-8 text-gray-400">{t('contacts.noContacts')}</div>
          ) : (
            <div className="space-y-3">
              {contacts.map((contact, index) => (
                <motion.div
                  key={contact.id || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-[#f0f2f5] transition-colors group border border-gray-100"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#25d366] to-[#128c7e] flex items-center justify-center text-white font-bold text-lg shadow-sm">
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-[#075e54] flex items-center gap-2">
                        <User className="w-4 h-4 text-[#128c7e]" />
                        {contact.name}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-[#128c7e]" />
                          {contact.number}
                        </span>
                      </div>
                      {contact.tag_ids && contact.tag_ids.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {contact.tag_ids.map((tagId) => {
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
                    </div>
                  </div>
                  <Button
                    onClick={() => handleDelete(contact.id)}
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
};

export default Contacts;
