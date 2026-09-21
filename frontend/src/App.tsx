import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DemoProvider } from './context/DemoContext';
import { AppShell } from './components/layout/AppShell';

// Pages
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { EmailAnalysisPage } from './pages/EmailAnalysisPage';
import { HeaderForensicsPage } from './pages/HeaderForensicsPage';
import { GeolocationPage } from './pages/GeolocationPage';
import { ThreatIntelPage } from './pages/ThreatIntelPage';
import { InfrastructureGraphPage } from './pages/InfrastructureGraphPage';
import { CasesPage } from './pages/CasesPage';
import { AlertsPage } from './pages/AlertsPage';
import { ReportsPage } from './pages/ReportsPage';
import { EvidenceVaultPage } from './pages/EvidenceVaultPage';
import { SettingsPage } from './pages/SettingsPage';

import { useDemo } from './context/DemoContext';

const MainRouter: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { currentPage, setCurrentPage } = useDemo();

  // Support direct browser history / popstate if user navigates with browser buttons
  React.useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname.replace(/^\//, '');
      if (path) {
        setCurrentPage(path);
      }
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, [setCurrentPage]);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case '':
      case 'dashboard':
        return <DashboardPage />;
      case 'email-analysis':
      case 'analyze':
        return <EmailAnalysisPage />;
      case 'header-forensics':
      case 'headers':
        return <HeaderForensicsPage />;
      case 'geolocation':
        return <GeolocationPage />;
      case 'threat-intel':
        return <ThreatIntelPage />;
      case 'infrastructure-graph':
      case 'graph':
        return <InfrastructureGraphPage />;
      case 'cases':
        return <CasesPage />;
      case 'alerts':
        return <AlertsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'evidence-vault':
      case 'evidence':
        return <EvidenceVaultPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <AppShell>
      {renderPage()}
    </AppShell>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DemoProvider>
          <MainRouter />
        </DemoProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
