import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { VaultProvider, useVault } from './context/VaultContext';
import OnboardingPage from './pages/OnboardingPage';
import UnlockPage from './pages/UnlockPage';
import DashboardPage from './pages/DashboardPage';
import PeopleLedgerPage from './pages/PeopleLedgerPage';
import BudgetsPage from './pages/BudgetsPage';
import AssetsPage from './pages/AssetsPage';
import LiabilitiesPage from './pages/LiabilitiesPage';
import Layout from './components/Layout';
import './index.css';

function AppContent() {
  const { vaults, isUnlocked } = useVault();

  if (vaults.length === 0) {
    return <OnboardingPage />;
  }

  if (!isUnlocked) {
    return <UnlockPage />;
  }

  return (
    <Layout>
      <Routes>
        <Route index element={<DashboardPage />} />
        <Route path="dashboard" element={<Navigate to="/" replace />} />
        <Route path="people-ledger" element={<PeopleLedgerPage />} />
        <Route path="budgets" element={<BudgetsPage />} />
        <Route path="assets" element={<AssetsPage />} />
        <Route path="liabilities" element={<LiabilitiesPage />} />
        <Route path="accounts" element={<div className="p-8">Accounts Page - Coming Soon</div>} />
        <Route path="transactions" element={<div className="p-8">Transactions Page - Coming Soon</div>} />
        <Route path="categories" element={<div className="p-8">Categories Page - Coming Soon</div>} />
        <Route path="settings" element={<div className="p-8">Settings Page - Coming Soon</div>} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <HashRouter>
      <VaultProvider>
        <AppContent />
      </VaultProvider>
    </HashRouter>
  );
}

export default App;
