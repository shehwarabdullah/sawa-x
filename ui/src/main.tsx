import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'

import { AppProvider } from './context/AppContext'
import Layout from './components/Layout'

// Admin pages
import AdminDashboard  from './pages/admin/AdminDashboard'
import KYCApprovals    from './pages/admin/KYCApprovals'
import Portfolios      from './pages/admin/Portfolios'
import SPVProposals    from './pages/admin/SPVProposals'
import AccessRequests  from './pages/admin/AccessRequests'

// Operator pages
import OperatorDashboard from './pages/operator/OperatorDashboard'
import OperatorProjects  from './pages/operator/OperatorProjects'
import ProductionReports from './pages/operator/ProductionReports'

// Investor pages
import InvestorDashboard from './pages/investor/InvestorDashboard'
import InvestorAccess    from './pages/investor/InvestorAccess'
import InvestorProjects  from './pages/investor/InvestorProjects'
import InvestorPortfolio from './pages/investor/InvestorPortfolio'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />

            {/* Admin */}
            <Route path="/admin/dashboard"  element={<AdminDashboard />} />
            <Route path="/admin/kyc"        element={<KYCApprovals />} />
            <Route path="/admin/portfolios" element={<Portfolios />} />
            <Route path="/admin/projects"   element={<SPVProposals />} />
            <Route path="/admin/access"     element={<AccessRequests />} />

            {/* Operator */}
            <Route path="/operator/dashboard" element={<OperatorDashboard />} />
            <Route path="/operator/projects"  element={<OperatorProjects />} />
            <Route path="/operator/reports"   element={<ProductionReports />} />

            {/* Investor */}
            <Route path="/investor/dashboard" element={<InvestorDashboard />} />
            <Route path="/investor/access"    element={<InvestorAccess />} />
            <Route path="/investor/projects"  element={<InvestorProjects />} />
            <Route path="/investor/portfolio" element={<InvestorPortfolio />} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AppProvider>
  </React.StrictMode>,
)
