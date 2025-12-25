
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Plus, Trash2, RefreshCw, Tag as TagIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/lib/i18n';

const Tags = () => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
  });
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/tags');
      const data = await response.json();
      setTags(Array.isArray(data) ? data : []);
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('tags.errorFetch'),
        variant: 'destructive',
      });
      setTags([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: t('common.success'),
          description: t('tags.successCreate'),
        });
        setFormData({ name: '' });
        fetchTags();
      } else {
        throw new Error('Failed to create tag');
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('tags.errorCreate'),
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://localhost:8000/tags/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: t('common.success'),
          description: t('tags.successDelete'),
        });
        fetchTags();
      } else {
        throw new Error('Failed to delete tag');
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('tags.errorDelete'),
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('tags.title')} - {t('nav.appName')}</title>
        <meta name="description" content={t('tags.subtitle')} />
      </Helmet>
      <div className="space-y-8">
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h1 className="text-3xl font-bold text-[#075e54]  mb-2">{t('tags.title')}</h1>
            <p className="text-[#128c7e] ">{t('tags.subtitle')}</p>
          </div>
          <Button onClick={fetchTags} variant="outline" className="gap-2 bg-white/90 text-[#075e54] border-[#075e54] hover:bg-[#25d366] hover:text-white hover:border-transparent">
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
            {t('tags.createNew')}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tagName" className="text-[#075e54]">{t('tags.name')}</Label>
              <Input
                id="tagName"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VIP Customer"
                required
                className="bg-gray-50 border-gray-200 text-[#075e54] focus:ring-[#128c7e] focus:border-[#128c7e]"
              />
            </div>
            <Button type="submit" className="w-full md:w-auto bg-[#25d366] hover:bg-[#128c7e] text-white font-semibold">
              <Plus className="w-4 h-4 mr-2" />
              {t('tags.createBtn')}
            </Button>
          </form>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white shadow-sm border border-[#e9edef] rounded-xl p-6"
        >
          <h2 className="text-xl font-bold text-[#075e54] mb-4 pb-4 border-b border-[#e9edef]">{t('tags.allTags')}</h2>
          {loading ? (
            <div className="text-center py-8 text-gray-500">{t('common.loading')}</div>
          ) : tags.length === 0 ? (
            <div className="text-center py-8 text-gray-400">{t('tags.noTags')}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {tags.map((tag, index) => (
                <motion.div
                  key={tag.id || index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-[#f0f2f5] transition-colors group border border-gray-100 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="p-1.5 rounded-full bg-[#dcf8c6]"
                    >
                      <TagIcon className="w-4 h-4 text-[#075e54]" />
                    </div>
                    <div className="font-semibold text-[#075e54] flex items-center gap-2">
                      {tag.name}
                    </div>
                  </div>
                  <Button
                    onClick={() => handleDelete(tag.id)}
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

export default Tags;
