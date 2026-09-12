import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { api } from '../../api';
import Modal from '../Modal.jsx';

const CATEGORIES = ['Training', 'Reference', 'Security'];

export default function EditContentModal({ item, onClose, onEdited }) {
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description || '');
  const [category, setCategory] = useState(item.category || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function save() {
    if (busy) return;
    if (!title.trim()) return setError('Title is required.');

    setError(null);
    setBusy(true);
    try {
      await api.put(`/api/contents/${item.id}`, {
        title: title.trim(),
        description: description.trim(),
        category: category,
      });
      onEdited?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save changes.');
      setBusy(false);
    }
  }

  const field =
    'w-full border-2 border-[#1C1C1A] bg-white px-3 py-2 text-xs font-bold uppercase tracking-tight text-[#1C1C1A] outline-none focus:shadow-[2px_2px_0px_0px_#002FA7]';

  return (
    <Modal title={`Edit — ${item.title}`} onClose={onClose}>
      {error && (
        <div className="border-2 border-[#C1272D] bg-white px-2 py-1.5 mb-3">
          <p className="text-xs font-bold uppercase tracking-tight text-[#C1272D]">{error}</p>
        </div>
      )}

      <label className="block mb-3">
        <span className="block text-[10px] font-black uppercase tracking-[0.15em] mb-1">Title *</span>
        <input className={field} value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>

      <label className="block mb-3">
        <span className="block text-[10px] font-black uppercase tracking-[0.15em] mb-1">Description</span>
        <textarea
          className={`${field} resize-y h-20`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>

      <label className="block mb-4">
        <span className="block text-[10px] font-black uppercase tracking-[0.15em] mb-1">Category</span>
        <select className={`${field} cursor-pointer`} value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">—</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </label>

      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="border-2 border-[#1C1C1A] bg-white px-3 py-1.5 text-xs font-black uppercase tracking-tight cursor-pointer">
          Cancel
        </button>
        <button
          onClick={save}
          disabled={busy}
          className="inline-flex items-center gap-1.5 bg-[#002FA7] text-white border-2 border-[#1C1C1A] px-4 py-1.5 text-xs font-black uppercase tracking-tight shadow-[2px_2px_0px_0px_#1C1C1A] active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-50 cursor-pointer"
        >
          <Pencil size={14} strokeWidth={2} />
          {busy ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </Modal>
  );
}