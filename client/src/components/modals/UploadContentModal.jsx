import { useRef, useState } from 'react';
import { TriangleAlert, Upload } from 'lucide-react';
import { api } from '../../api';
import Modal from '../Modal.jsx';

const ALLOWED_EXT = ['mp4', 'pdf', 'html'];
const MAX_BYTES = 50 * 1024 * 1024;
const CATEGORIES = ['Training', 'Reference', 'Security'];

const field =
  'w-full border-2 border-[#1C1C1A] bg-white px-3 py-2 text-xs font-bold uppercase tracking-tight text-[#1C1C1A] outline-none focus:shadow-[2px_2px_0px_0px_#002FA7]';

export default function UploadContentModal({ onClose, onUploaded }) {
  const fileInputRef = useRef(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(null); // 0–100 while uploading
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  function validateFile(f) {
    if (!f) return 'A file is required.';
    const ext = (f.name.split('.').pop() || '').toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) return 'Only .mp4, .pdf and .html files are allowed.';
    if (f.size > MAX_BYTES) return 'File is over the 50 MB limit.';
    return null;
  }

  async function submit() {
    if (busy) return;

    if (!title.trim()) return setError('Title is required.');
    const fileError = validateFile(file);
    if (fileError) return setError(fileError);

    setError(null);
    setBusy(true);
    setProgress(0);

    const form = new FormData();
    form.append('title', title.trim());
    form.append('description', description.trim());
    if (category) form.append('category', category);
    form.append('file', file);

    try {
      await api.post('/api/contents', form, {
        onUploadProgress: (e) => {
          if (e.total > 0) setProgress(Math.min(100, Math.round((e.loaded / e.total) * 100)));
        },
      });
      onUploaded?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
      setProgress(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Upload new item" onClose={onClose}>
      {error && (
        <div className="flex items-start gap-2 border-2 border-[#C1272D] bg-white p-2 mb-3">
          <TriangleAlert size={15} strokeWidth={2} className="text-[#C1272D] shrink-0" />
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

      <label className="block mb-3">
        <span className="block text-[10px] font-black uppercase tracking-[0.15em] mb-1">Category</span>
        <select
          className={`${field} cursor-pointer`}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">—</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </label>

      <div className="mb-4">
        <span className="block text-[10px] font-black uppercase tracking-[0.15em] mb-1">
          File * <span className="text-[#1C1C1A]/50">(.mp4 / .pdf / .html, max 50 MB)</span>
        </span>
        <input
          ref={fileInputRef}
          type="file"
          accept=".mp4,.pdf,.html"
          onChange={(e) => setFile(e.target.files?.[0])}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 border-2 border-[#1C1C1A] bg-white px-3 py-2 text-xs font-black uppercase tracking-tight shadow-[2px_2px_0px_0px_#1C1C1A] active:translate-x-[2px] active:translate-y-[2px] cursor-pointer"
        >
          <Upload size={15} strokeWidth={2} />
          {file ? file.name : 'Choose file'}
        </button>
        {file && (
          <p className="mt-1 text-[10px] uppercase tracking-tight text-[#1C1C1A]/60">
            {file.name} — {Math.round(file.size / 1024 / 1024 * 10) / 10} MB
          </p>
        )}
      </div>

      {progress !== null && (
        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-[0.15em] text-[#1C1C1A] mb-1">
            Uploading… {progress}%
          </p>
          <div className="h-4 border-2 border-[#1C1C1A] bg-white">
            <div className="h-full bg-[#002FA7] transition-[width] duration-150" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="border-2 border-[#1C1C1A] bg-white px-3 py-1.5 text-xs font-black uppercase tracking-tight cursor-pointer">
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={busy}
          className="inline-flex items-center gap-1.5 bg-[#002FA7] text-white border-2 border-[#1C1C1A] px-4 py-1.5 text-xs font-black uppercase tracking-tight shadow-[2px_2px_0px_0px_#1C1C1A] active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-50 cursor-pointer"
        >
          {busy ? 'Uploading…' : 'Upload'}
        </button>
      </div>
    </Modal>
  );
}