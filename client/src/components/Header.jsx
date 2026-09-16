import { LogOut, Search, Upload } from 'lucide-react';
import { btnGhost, btnPrimary, RoleBadge } from './ui.jsx';

const CATEGORIES = ['ALL', 'Training', 'Reference', 'Security'];

export default function Header({
  user,
  search,
  onSearchChange,
  category,
  onCategoryChange,
  onUpload,
  onLogout,
}) {
  return (
    <header className="border-b-2 border-[#1C1C1A] bg-[#FBF9F5]">
      <div className="flex flex-wrap items-center gap-3 px-6 py-4">

        <div>
          <h1 className="font-black uppercase tracking-tight text-lg leading-none text-[#1C1C1A]">
            Secure Content Portal
          </h1>
          <p className="mt-1 hidden text-[10px] uppercase tracking-[0.25em] text-[#1C1C1A]/70 sm:block">
            Internal media &amp; document library
          </p>
        </div>

        <label className="relative w-full sm:w-auto sm:min-w-[220px] sm:flex-1">
          <Search size={15} strokeWidth={2} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#1C1C1A]" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="SEARCH TITLE / DESCRIPTION"
            className="w-full border-2 border-[#1C1C1A] bg-white pl-8 pr-2 py-1.5 text-xs font-bold uppercase tracking-tight text-[#1C1C1A] outline-none focus:shadow-[2px_2px_0px_0px_#002FA7]"
          />
        </label>

        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="w-full cursor-pointer border-2 border-[#1C1C1A] bg-white px-2 py-1.5 text-xs font-bold uppercase tracking-tight text-[#1C1C1A] sm:w-auto"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {user.role === 'admin' && (
          <button onClick={onUpload} className={btnPrimary}>
            <Upload size={15} strokeWidth={2} />
            Upload Item
          </button>
        )}

        <div className="ml-auto text-left">
          <p className="text-[11px] font-black uppercase tracking-tight leading-none text-[#1C1C1A]">{user.name}</p>
          <p className="text-[10px] text-[#1C1C1A]/70 uppercase tracking-tight mt-0.5">{user.email}</p>
        </div>
        <RoleBadge role={user.role} />
        <button onClick={onLogout} className={btnGhost}>
          <LogOut size={15} strokeWidth={2} />
          Logout
        </button>
      </div>
    </header>
  );
}