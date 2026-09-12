import { useEffect, useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import { api } from '../../api';
import Modal from '../Modal.jsx';

export default function DeleteContentModal({ item, onClose, onDeleted }) {
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 5000);
    return () => clearTimeout(t);
  }, [armed]);

  async function confirm() {
    if (!armed) {
      setArmed(true);
      return;
    }
    if (busy) return;

    setBusy(true);
    try {
      await api.delete(`/api/contents/${item.id}`);
      onDeleted?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete this item.');
      setArmed(false);
      setBusy(false);
    }
  }

  return (
    <Modal title="Delete item" onClose={onClose}>
      <div className="flex items-start gap-3 mt-1">
        <span className="grid place-items-center h-10 w-10 shrink-0 border-2 border-[#C1272D] bg-[#C1272D] text-white">
          <TriangleAlert size={20} strokeWidth={2} />
        </span>
        <div>
          <h3 className="font-black uppercase tracking-tight text-sm text-[#1C1C1A]">
            {armed ? 'Are you absolutely sure?' : `Delete “${item.title}”?`}
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-[#1C1C1A]/75">
            {armed
              ? 'This permanently removes the record from the library. A signed link that is already open keeps working until it expires, but the item will no longer be listed or accessible.'
              : 'This will permanently remove the content record from MySQL. This action cannot be undone.'}
          </p>
        </div>
      </div>

      {armed && (
        <div className="mt-3 border-2 border-[#C1272D] bg-white px-3 py-2">
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#C1272D]">
            Warning — confirm deletion within 5 seconds
          </p>
        </div>
      )}

      {error && (
        <p className="mt-2 text-xs font-bold uppercase tracking-tight text-[#C1272D]">{error}</p>
      )}

      <div className="mt-4 flex justify-end gap-3">
        <button onClick={onClose} className="border-2 border-[#1C1C1A] bg-white px-3 py-1.5 text-xs font-black uppercase tracking-tight cursor-pointer">
          Cancel
        </button>
        <button
          onClick={confirm}
          disabled={busy}
          className="inline-flex items-center gap-1.5 bg-[#C1272D] text-white border-2 border-[#1C1C1A] px-4 py-1.5 text-xs font-black uppercase tracking-tight shadow-[2px_2px_0px_0px_#C1272D] active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-50 cursor-pointer"
        >
          {armed ? 'Yes — delete forever' : 'Delete'}
        </button>
      </div>
    </Modal>
  );
}