
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Toaster } from '@/components/ui/toaster';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Connections from '@/pages/Connections';
import Tags from '@/pages/Tags';
import Contacts from '@/pages/Contacts';
import ContactLists from '@/pages/ContactLists';
import ContactImport from '@/pages/ContactImport';
import Campaigns from '@/pages/Campaigns';
import CampaignStats from '@/pages/CampaignStats';
import CampaignLogs from '@/pages/CampaignLogs';
import { LanguageProvider } from '@/lib/i18n';
import { isAuthenticated } from '@/lib/auth';
import Login from '@/pages/Login';
import Register from '@/pages/Register';

const RequireAuth = () => {
  const location = useLocation();
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <Outlet />;
};

function App() {
  return (
    <LanguageProvider>
      <Helmet>
        <title>WhatsApp Campaign Manager</title>
        <meta name="description" content="Manage your WhatsApp campaigns, connections, contacts, and tags all in one place." />
      </Helmet>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<RequireAuth />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/connections" element={<Connections />} />
              <Route path="/tags" element={<Tags />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/lists" element={<ContactLists />} />
              <Route path="/contacts/import" element={<ContactImport />} />
              <Route path="/campaigns" element={<Campaigns />} />
              <Route path="/campaigns/:id/stats" element={<CampaignStats />} />
              <Route path="/campaigns/:id/logs" element={<CampaignLogs />} />
            </Route>
          </Route>
        </Routes>
      </Router>
      <Toaster />
    </LanguageProvider>
  );
}

export default App;
