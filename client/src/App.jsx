import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Login from './components/Login.jsx';
import Header from './components/Header.jsx';
import Dashboard from './components/Dashboard.jsx';

function BootSplash() {
  return (
    <div className="min-h-screen bg-[#FBF9F5] grid place-items-center">
      <div className="border-2 border-[#1C1C1A] bg-[#FBF9F5] px-6 py-4 shadow-[4px_4px_0px_0px_#1C1C1A]">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#1C1C1A]">
          Checking session&hellip;
        </p>
      </div>
    </div>
  );
}

function Shell() {
  const { user, loading, logout } = useAuth();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [uploadOpen, setUploadOpen] = useState(false);

  if (loading) return <BootSplash />;
  if (!user) return <Login />;

  return (
    <div className="min-h-screen bg-[#FBF9F5] flex flex-col">
      <Header
        user={user}
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
        onUpload={() => setUploadOpen(true)}
        onLogout={logout}
      />
      <Dashboard
        search={search}
        category={category}
        uploadOpen={uploadOpen}
        onUploadClose={() => setUploadOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}