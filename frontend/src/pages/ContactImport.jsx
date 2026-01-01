import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { FileUp, RefreshCw, Tag, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/lib/i18n';
import { apiFetch } from '@/lib/api';

const parseContactsPayload = (raw) => {
  const trimmed = raw.trim();
  if (!trimmed) {
    return [];
  }

  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    const json = JSON.parse(trimmed);
    const contacts = Array.isArray(json) ? json : json.contacts;
    return Array.isArray(contacts) ? contacts : [];
  }

  const lines = trimmed.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) {
    return [];
  }
  const header = lines[0].split(',').map((value) => value.trim().toLowerCase());
  const hasHeader = header.includes('name') || header.includes('number');
  const nameIndex = header.indexOf('name');
  const numberIndex = header.indexOf('number');
  const startIndex = hasHeader ? 1 : 0;

  return lines.slice(startIndex).map((line) => {
    const parts = line.split(',').map((value) => value.trim());
    return {
      name: parts[hasHeader ? nameIndex : 0] || '',
      number: parts[hasHeader ? numberIndex : 1] || '',
    };
  }).filter((contact) => contact.name && contact.number);
};

const ContactImport = () => {
  const [tags, setTags] = useState([]);
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sourceText, setSourceText] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedListId, setSelectedListId] = useState('');
  const [result, setResult] = useState(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    fetchTags();
    fetchLists();
  }, []);

  const fetchTags = async () => {
    try {
      const response = await apiFetch('/tags');
      const data = await response.json();
      setTags(Array.isArray(data) ? data : []);
    } catch (error) {
      setTags([]);
    }
  };

  const fetchLists = async () => {
    try {
      const response = await apiFetch('/lists');
      const data = await response.json();
      setLists(Array.isArray(data) ? data : []);
    } catch (error) {
      setLists([]);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setSourceText(String(e.target?.result || ''));
    };
    reader.readAsText(file);
  };

  const toggleTag = (tagId) => {
    setSelectedTags((prev) => (
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    ));
  };

  const parsedPreview = useMemo(() => {
    try {
      return parseContactsPayload(sourceText).slice(0, 3);
    } catch (error) {
      return [];
    }
  }, [sourceText]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    let contacts = [];

    try {
      contacts = parseContactsPayload(sourceText);
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('import.invalidPayload'),
        variant: 'destructive',
      });
      return;
    }

    if (contacts.length === 0) {
      toast({
        title: t('common.error'),
        description: t('import.emptyPayload'),
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiFetch('/contacts/import', {
        method: 'POST',
        body: JSON.stringify({
          contacts,
          tag_ids: selectedTags,
          list_id: selectedListId || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to import contacts');
      }
      const data = await response.json();
      setResult(data);
      toast({
        title: t('common.success'),
        description: t('import.success'),
      });
      setSourceText('');
      setSelectedTags([]);
      setSelectedListId('');
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('import.error'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('import.title')} - {t('nav.appName')}</title>
        <meta name="description" content={t('import.subtitle')} />
      </Helmet>
      <div className="space-y-8">
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h1 className="text-3xl font-bold text-[#075e54] mb-2">{t('import.title')}</h1>
            <p className="text-[#128c7e]">{t('import.subtitle')}</p>
          </div>
          <Button
            onClick={() => {
              fetchTags();
              fetchLists();
            }}
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
          className="bg-white shadow-sm border border-[#e9edef] rounded-xl p-6 space-y-6"
        >
          <div>
            <h2 className="text-xl font-bold text-[#075e54] mb-2">{t('import.formTitle')}</h2>
            <p className="text-sm text-gray-500">{t('import.helper')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="importPayload" className="text-[#075e54]">{t('import.payloadLabel')}</Label>
              <Textarea
                id="importPayload"
                value={sourceText}
                onChange={(event) => setSourceText(event.target.value)}
                rows={8}
                placeholder={t('import.payloadPlaceholder')}
                className="bg-gray-50 border-gray-200 text-[#075e54] focus:ring-[#128c7e] focus:border-[#128c7e] resize-none"
              />
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <Label htmlFor="fileUpload" className="text-[#075e54]">{t('import.uploadLabel')}</Label>
              <input
                id="fileUpload"
                type="file"
                accept=".csv,application/json,text/csv"
                onChange={handleFileUpload}
                className="text-sm text-[#075e54]"
              />
            </div>

            {parsedPreview.length > 0 && (
              <div className="rounded-lg bg-[#f7f9f9] border border-[#e9edef] p-4">
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">{t('import.preview')}</p>
                <ul className="space-y-1 text-sm text-[#075e54]">
                  {parsedPreview.map((contact, index) => (
                    <li key={`${contact.number}-${index}`} className="flex justify-between">
                      <span>{contact.name}</span>
                      <span className="text-gray-500">{contact.number}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="listSelect" className="text-[#075e54]">{t('import.listLabel')}</Label>
                <select
                  id="listSelect"
                  value={selectedListId}
                  onChange={(event) => setSelectedListId(event.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-[#075e54] focus:ring-[#128c7e] focus:border-[#128c7e] focus:outline-none"
                >
                  <option value="">{t('import.listPlaceholder')}</option>
                  {lists.map((list) => (
                    <option key={list.id} value={list.id}>{list.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-[#075e54]">{t('import.tagsLabel')}</Label>
                <div className="flex gap-2 flex-wrap">
                  {tags.length === 0 ? (
                    <span className="text-sm text-gray-400">{t('import.noTags')}</span>
                  ) : (
                    tags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                          selectedTags.includes(tag.id)
                            ? 'ring-2 ring-white text-white bg-[#075e54]'
                            : 'text-[#075e54] hover:bg-[#dcf8c6] bg-gray-100'
                        }`}
                      >
                        {tag.name}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full md:w-auto bg-[#25d366] hover:bg-[#128c7e] text-white font-semibold">
              <FileUp className="w-4 h-4 mr-2" />
              {loading ? t('common.loading') : t('import.submit')}
            </Button>
          </form>
        </motion.div>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white shadow-sm border border-[#e9edef] rounded-xl p-6"
          >
            <h3 className="text-lg font-bold text-[#075e54] mb-4">{t('import.resultTitle')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-[#075e54]">
              <div className="flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-[#25d366]" />
                <span>{t('import.imported', { count: result.imported })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#128c7e]" />
                <span>{t('import.skipped', { count: result.skipped })}</span>
              </div>
              <div className="flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-[#075e54]" />
                <span>{t('import.resultList', { list: result.list_id || t('import.none') })}</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
};

export default ContactImport;
