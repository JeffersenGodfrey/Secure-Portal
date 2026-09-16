import { useEffect, useCallback, useState } from 'react';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext.jsx';
import { CategoryTag, TypeBadge } from './ui.jsx';
import SecureViewerModal from './SecureViewerModal.jsx';
import UploadContentModal from './modals/UploadContentModal.jsx';
import EditContentModal from './modals/EditContentModal.jsx';
import DeleteContentModal from './modals/DeleteContentModal.jsx';

export default function Dashboard({ search, category, uploadOpen, onUploadClose }) {
  const { user } = useAuth();
  const isAdmin = user.role === 'admin';

  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [viewer, setViewer] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/contents');
      setContents(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load the library.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const q = search.trim().toUpperCase();
  const filtered = contents.filter(
    (c) =>
      (category === 'ALL' || c.category === category) &&
      (!q || `${c.title} ${c.description} ${c.category}`.toUpperCase().includes(q))
  );

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-8">
      <div className="flex items-center justify-between border-b-2 border-[#1C1C1A] py-2">
        <h2 className="font-black uppercase tracking-tight text-sm text-[#1C1C1A]">Library index</h2>
        <p className="text-[10px] uppercase tracking-[0.15em] text-[#1C1C1A]/60">
          {filtered.length} item{filtered.length === 1 ? '' : 's'} / {category}
        </p>
      </div>

      {loading && (
        <div className="mt-10 grid place-items-center">
          <p className="border-2 border-[#1C1C1A] bg-white px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] shadow-[4px_4px_0px_0px_#1C1C1A]">
            Loading assets&hellip;
          </p>
        </div>
      )}

      {!loading && error && (
        <div className="mt-10 border-2 border-[#C1272D] bg-white p-4 shadow-[4px_4px_0px_0px_#C1272D]">
          <p className="font-black uppercase tracking-tight text-xs text-[#C1272D]">Error</p>
          <p className="mt-1 text-sm text-[#1C1C1A]">{error}</p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-6">
          {filtered.map((item) => (
            <article
              key={item.id}
              onClick={() => setViewer(item)}
              className="group cursor-pointer border-2 border-[#1C1C1A] bg-[#FBF9F5] shadow-[4px_4px_0px_0px_#1C1C1A] hover:shadow-[6px_6px_0px_0px_#1C1C1A] active:translate-x-[2px] active:translate-y-[2px] transition-all duration-75 flex flex-col"
            >
              <div className="flex items-center justify-between px-3 py-2 border-b-2 border-[#1C1C1A] bg-white">
                <TypeBadge type={item.type} />
                <CategoryTag category={item.category} />
              </div>

              <div className="px-3 py-4 flex-1">
                <h3 className="line-clamp-2 font-black uppercase tracking-tight text-sm leading-tight text-[#1C1C1A]">
                  {item.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#1C1C1A]/70">
                  {item.description || 'No description provided.'}
                </p>
              </div>

              <div className="flex items-center justify-between px-3 py-2 border-t-2 border-[#1C1C1A]">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-tight text-[#1C1C1A]">
                  <Eye size={13} strokeWidth={2} />
                  {item.views_count} views
                </span>

                {isAdmin && (
                  <span className="inline-flex gap-1.5 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditTarget(item); }}
                      onMouseDown={(e) => e.stopPropagation()}
                      aria-label={`Edit ${item.title}`}
                      className="grid place-items-center h-7 w-7 border-2 border-[#1C1C1A] bg-[#FBF9F5] active:translate-x-[2px] active:translate-y-[2px] cursor-pointer"
                    >
                      <Pencil size={14} strokeWidth={2} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(item); }}
                      onMouseDown={(e) => e.stopPropagation()}
                      aria-label={`Delete ${item.title}`}
                      className="grid place-items-center h-7 w-7 border-2 border-[#1C1C1A] bg-[#C1272D] text-white active:translate-x-[2px] active:translate-y-[2px] cursor-pointer"
                    >
                      <Trash2 size={14} strokeWidth={2} />
                    </button>
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="mt-6 border-2 border-dashed border-[#1C1C1A]/40 bg-white px-6 py-12 text-center">
          <p className="font-black uppercase tracking-tight text-sm text-[#1C1C1A]">
            No content found
          </p>
          <p className="mt-2 text-xs leading-relaxed text-[#1C1C1A]/70">
            No content found matching your search. Try adjusting your filters.
          </p>
        </div>
      )}

      {uploadOpen && (
        <UploadContentModal onClose={onUploadClose} onUploaded={reload} />
      )}
      {editTarget && (
        <EditContentModal item={editTarget} onClose={() => setEditTarget(null)} onEdited={reload} />
      )}
      {deleteTarget && (
        <DeleteContentModal item={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={reload} />
      )}
      {viewer && (
        <SecureViewerModal content={viewer} onClose={() => setViewer(null)} />
      )}
    </main>
  );
}