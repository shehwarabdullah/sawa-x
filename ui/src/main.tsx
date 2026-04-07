import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import './index.css';

import AdminDashboard from './pages/admin/AdminDashboard';
import KYCApprovals from './pages/admin/KYCApprovals';
import Portfolios from './pages/admin/Portfolios';
import SPVApprovals from './pages/admin/SPVApprovals';
import AccessControl from './pages/admin/AccessControl';
import TrancheManagement from './pages/admin/TrancheManagement';
import WaterfallSettlement from './pages/admin/WaterfallSettlement';
import YieldManagement from './pages/admin/YieldManagement';

import OperatorDashboard from './pages/operator/OperatorDashboard';
import CreateSPV from './pages/operator/CreateSPV';
import OperatorProjects from './pages/operator/OperatorProjects';
import Production from './pages/operator/Production';
import OperatorFinancials from './pages/operator/OperatorFinancials';

import InvestorDashboard from './pages/investor/InvestorDashboard';
import InvestorKYC from './pages/investor/InvestorKYC';
import InvestorRegions from './pages/investor/InvestorRegions';
import InvestorProjects from './pages/investor/InvestorProjects';
import InvestorProduction from './pages/investor/InvestorProduction';
import InvestorYieldClaim from './pages/investor/InvestorYieldClaim';
import InvestorWaterfall from './pages/investor/InvestorWaterfall';
import InvestorPortfolio from './pages/investor/InvestorPortfolio';

function AppRoutes() {
  const { loggedIn, role } = useApp();
  if (!loggedIn) return <LoginPage />;
  const home = role === 'Admin' ? '/admin' : role === 'Operator' ? '/operator' : '/investor';

  return (
    <Layout>
      <Routes>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/kyc" element={<KYCApprovals />} />
        <Route path="/admin/portfolios" element={<Portfolios />} />
        <Route path="/admin/spv-approvals" element={<SPVApprovals />} />
        <Route path="/admin/access" element={<AccessControl />} />
        <Route path="/admin/tranches" element={<TrancheManagement />} />
        <Route path="/admin/waterfall" element={<WaterfallSettlement />} />
        <Route path="/admin/yields" element={<YieldManagement />} />

        <Route path="/operator" element={<OperatorDashboard />} />
        <Route path="/operator/create-spv" element={<CreateSPV />} />
        <Route path="/operator/projects" element={<OperatorProjects />} />
        <Route path="/operator/production" element={<Production />} />
        <Route path="/operator/financials" element={<OperatorFinancials />} />

        <Route path="/investor" element={<InvestorDashboard />} />
        <Route path="/investor/kyc" element={<InvestorKYC />} />
        <Route path="/investor/regions" element={<InvestorRegions />} />
        <Route path="/investor/projects" element={<InvestorProjects />} />
        <Route path="/investor/production" element={<InvestorProduction />} />
        <Route path="/investor/yields" element={<InvestorYieldClaim />} />
        <Route path="/investor/waterfall" element={<InvestorWaterfall />} />
        <Route path="/investor/portfolio" element={<InvestorPortfolio />} />

        <Route path="*" element={<Navigate to={home} />} />
      </Routes>
    </Layout>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>
);
