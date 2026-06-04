import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import UsersPage from './pages/UsersPage';
import BoardPage from './pages/BoardPage';
import SprintsPage from './pages/SprintsPage';
import MembersPage from './pages/MembersPage';
import CredentialsPage from './pages/CredentialsPage';
import DocsPage from './pages/DocsPage';
import AuditPage from './pages/AuditPage';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-56 p-8 min-h-screen">
        {children}
      </main>
    </div>
  );
}

function ProjectRoutes() {
  return (
    <Routes>
      <Route index element={<BoardPage />} />
      <Route path="sprints" element={<SprintsPage />} />
      <Route path="members" element={<MembersPage />} />
      <Route path="credentials" element={<CredentialsPage />} />
      <Route path="docs" element={<DocsPage />} />
      <Route path="audit" element={<AuditPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ style: { background: '#18181b', color: '#e4e4e7', border: '1px solid #27272a' } }} />
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/projects/:id/*" element={<ProjectRoutes />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
