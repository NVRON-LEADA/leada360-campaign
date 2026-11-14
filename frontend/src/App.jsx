import { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import Dashboard from './pages/Dashboard';
import Campaigns from './pages/Campaigns';
import Analytics from './pages/Analytics';
import Contacts from './pages/Contacts';
import Templates from './pages/Templates';
import Automation from './pages/Automation';
import Deliverability from './pages/Deliverability';
import UserManagement from './pages/UserManagement';
import LoginPage from './pages/LoginPage';
import CampaignWizard from './components/campaign-wizard/CampaignWizard';
import { useAuth } from './context/AuthContext';

export default function App() {
  const { currentUser } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');
  const [showWizard, setShowWizard] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [selectedTemplateForWizard, setSelectedTemplateForWizard] = useState(null);

  // If user is not authenticated, render Login Page
  if (!currentUser) {
    return <LoginPage />;
  }

  const handleEditCampaign = (campaign) => {
    setSelectedTemplateForWizard(null);
    setEditingCampaign(campaign);
    setShowWizard(true);
  };

  const handleCreateCampaign = () => {
    setSelectedTemplateForWizard(null);
    setEditingCampaign(null);
    setShowWizard(true);
  };

  const handleCreateWithTemplate = (template) => {
    setEditingCampaign(null);
    setSelectedTemplateForWizard(template);
    setShowWizard(true);
  };

  const pages = {
    dashboard: <Dashboard onCreateCampaign={handleCreateCampaign} setActivePage={setActivePage} />,
    campaigns: (
      <Campaigns 
        onCreateCampaign={handleCreateCampaign} 
        onEditCampaign={handleEditCampaign}
        setActivePage={setActivePage} 
        setSelectedCampaign={setSelectedCampaign} 
      />
    ),
    analytics: <Analytics campaign={selectedCampaign} setActivePage={setActivePage} />,
    contacts: <Contacts />,
    templates: (
      <Templates 
        onCreateWithTemplate={handleCreateWithTemplate}
        onSelectTemplate={handleCreateWithTemplate}
      />
    ),
    automation: <Automation />,
    deliverability: <Deliverability />,
    reports: <Analytics campaign={selectedCampaign} setActivePage={setActivePage} />,
    users: <UserManagement />,
    settings: <UserManagement />,
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F7F9FC]">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar 
          onCreateCampaign={handleCreateCampaign} 
          setActivePage={setActivePage} 
        />
        <main className="flex-1 overflow-y-auto">
          {pages[activePage] || pages.dashboard}
        </main>
      </div>
      {showWizard && (
        <CampaignWizard 
          onClose={() => { 
            setShowWizard(false); 
            setEditingCampaign(null); 
            setSelectedTemplateForWizard(null);
          }} 
          setActivePage={setActivePage} 
          initialCampaign={editingCampaign}
          initialTemplate={selectedTemplateForWizard}
        />
      )}
    </div>
  );
}
