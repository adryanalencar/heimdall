
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, Link2, Tag, Users, Megaphone, LayoutDashboard, ClipboardList, Upload } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Layout = ({ children }) => {
  const location = useLocation();
  const { t } = useTranslation();

  const navItems = [
    { path: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { path: '/connections', label: t('nav.connections'), icon: Link2 },
    { path: '/tags', label: t('nav.tags'), icon: Tag },
    { path: '/contacts', label: t('nav.contacts'), icon: Users },
    { path: '/campaigns', label: t('nav.campaigns'), icon: Megaphone },
  ];
  const contactSubItems = [
    { path: '/contacts', label: t('nav.contacts'), icon: Users },
    { path: '/lists', label: t('nav.lists'), icon: ClipboardList },
    { path: '/contacts/import', label: t('nav.contactsImport'), icon: Upload },
  ];

  return (
    <div className="min-h-screen bg-[#ece5dd]">
      {/* WhatsApp Header Style */}
      <nav className="bg-[#075e54] text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white rounded-full">
                 <MessageSquare className="w-6 h-6 text-[#25d366]" fill="#25d366" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">{t('nav.appName')}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  if (item.path === '/contacts') {
                    const isContactsActive = contactSubItems.some((subItem) => location.pathname === subItem.path);
                    return (
                      <DropdownMenu key={item.path}>
                        <DropdownMenuTrigger asChild>
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all text-sm font-medium ${
                              isContactsActive
                                ? 'bg-[#128c7e] text-white shadow-sm'
                                : 'text-[#dcf8c6] hover:bg-[#128c7e]/50 hover:text-white'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="hidden sm:inline">{item.label}</span>
                          </motion.button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="bg-slate-800 border-slate-700 text-slate-200">
                          {contactSubItems.map((subItem) => {
                            const SubIcon = subItem.icon;
                            return (
                              <DropdownMenuItem asChild key={subItem.path}>
                                <Link
                                  to={subItem.path}
                                  className={`flex items-center gap-2 cursor-pointer hover:bg-slate-700 focus:bg-slate-700 ${
                                    location.pathname === subItem.path ? 'text-green-400 font-bold' : ''
                                  }`}
                                >
                                  <SubIcon className="w-4 h-4" />
                                  {subItem.label}
                                </Link>
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    );
                  }
                  return (
                    <Link key={item.path} to={item.path}>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all text-sm font-medium ${
                          isActive
                            ? 'bg-[#128c7e] text-white shadow-sm'
                            : 'text-[#dcf8c6] hover:bg-[#128c7e]/50 hover:text-white'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{item.label}</span>
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </nav>
      {/* Decorative background strip for WhatsApp web look */}
      <div className="bg-[#009688] h-32 w-full absolute top-16 left-0 z-0 hidden" />
      
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
