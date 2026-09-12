import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, Lock, RefreshCw } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext.jsx';
import Modal from './Modal.jsx';
import PdfRenderer from './PdfRenderer.jsx';
import { TypeBadge } from './ui.jsx';

// Fixed diagonal email watermark across the entire viewing surface.
function Watermark({ email }) {
  const cells = Array.from({ length: 12 });
  return (
    <div className="pointer-events-none select-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 grid grid-cols-3 grid-rows-4 place-items-center gap-4 rotate-[-12deg] scale-110">
        {cells.map((_, i) => (
          <span
            key={i}
            className="font-black uppercase tracking-tight text-[#1C1C1A] opacity-15 text-sm whitespace-nowrap"
          >
            {email} &bull; CONFIDENTIAL
          </span>
        ))}
      </div>
    </div>
  );
}

export default function SecureViewerModal({ content, onClose }) {
  const { user } = useAuth();

  const [access, setAccess] = useState(null);
  const [countdown, setCountdown] = useState(60);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setExpired(false);

    api
      .get(`/api/contents/${content.id}/access`)
      .then(({ data }) => {
        if (!active) return;
        setAccess(data);
        setCountdown(data.expiresInSeconds || 60);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.response?.data?.message || 'Could not open this item.');
      })
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [content.id]);

  useEffect(() => {
    if (!access || countdown <= 0) return;
    const t = setInterval(() => setCountdown((n) => Math.max(0, n - 1)), 1000);
    return () => clearInterval(t);
  }, [access, countdown]);

  useEffect(() => {
    if (access && countdown === 0) setExpired(true);
  }, [access, countdown]);

  function refreshLink() {
    setAccess(null);
    setExpired(false);
    setLoading(true);
    api
      .get(`/api/contents/${content.id}/access`)
      .then(({ data }) => {
        setAccess(data);
        setCountdown(data.expiresInSeconds || 60);
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not refresh the link.'))
      .finally(() => setLoading(false));
  }

  const blockContext = (e) => e.preventDefault();

  return (
    <Modal title={`Secure viewer — ${content.title}`} onClose={onClose} width="max-w-4xl">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <TypeBadge type={content.type} />
          <span className="max-w-[420px] truncate text-[11px] font-bold uppercase tracking-tight text-[#1C1C1A]">
            {content.title}
          </span>
        </div>

        {access && !expired && (
          <span
            className={
              'inline-flex items-center gap-1.5 border-2 border-[#1C1C1A] px-2 py-1 font-mono text-[11px] uppercase ' +
              (countdown <= 10 ? 'bg-[#C1272D] text-white' : 'bg-white text-[#1C1C1A]')
            }
          >
            <Lock size={12} strokeWidth={2} />
            expires in {countdown}s
          </span>
        )}
        {expired && (
          <button
            onClick={refreshLink}
            className="inline-flex items-center gap-1.5 border-2 border-[#1C1C1A] bg-[#002FA7] text-white px-2 py-1 text-[10px] font-black uppercase tracking-tight shadow-[2px_2px_0px_0px_#1C1C1A] active:translate-x-[2px] active:translate-y-[2px] cursor-pointer"
          >
            <RefreshCw size={13} strokeWidth={2} /> Refresh link
          </button>
        )}
      </div>

      <div
        onContextMenu={blockContext}
        className="relative border-2 border-[#1C1C1A] bg-black select-none"
      >
        {loading && (
          <div className="grid place-items-center h-48 bg-[#FBF9F5]">
            <p className="inline-flex items-center gap-2 border-2 border-[#1C1C1A] bg-white px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] shadow-[4px_4px_0px_0px_#1C1C1A]">
              <Loader2 size={14} strokeWidth={2} className="animate-spin" />
              Loading preview…
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="grid place-items-center h-48 bg-[#FBF9F5]">
            <div className="border-2 border-[#C1272D] bg-white px-4 py-3 text-center">
              <p className="inline-flex items-center gap-2 font-black uppercase tracking-tight text-xs text-[#C1272D]">
                <AlertTriangle size={14} strokeWidth={2} /> {error}
              </p>
            </div>
          </div>
        )}

        {!loading && !error && access && content.type === 'video' && (
          <>
            <video
              src={access.signedUrl}
              controls
              controlsList="nodownload"
              disablePictureInPicture
              className="block w-full max-h-[62vh] bg-black"
            />
            <Watermark email={user.email} />
          </>
        )}

        {!loading && !error && access && content.type === 'pdf' && (
          <div className="relative">
            <PdfRenderer signedUrl={access.signedUrl} expired={expired} />
            {!expired && <Watermark email={user.email} />}
            <span className="absolute bottom-14 left-2 inline-flex items-center gap-1 border-2 border-[#1C1C1A] bg-white px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-tight text-[#1C1C1A]">
              <Lock size={10} strokeWidth={2} /> No download
            </span>
          </div>
        )}

        {!loading && !error && access && content.type === 'html' && (
          <div className="relative">
            {expired ? (
              <div className="grid place-items-center h-48 border-2 border-[#1C1C1A] bg-white text-center">
                <div>
                  <p className="font-black uppercase tracking-tight text-sm text-[#C1272D]">Link expired</p>
                  <p className="mt-1 text-xs text-[#1C1C1A]/70">Use “Refresh link” above to continue viewing.</p>
                </div>
              </div>
            ) : (
              <>
                <iframe
                  src={access.signedUrl}
                  sandbox="allow-scripts"
                  title={content.title}
                  className="w-full h-[60vh] bg-white border-0"
                />
                <Watermark email={user.email} />
              </>
            )}
          </div>
        )}
      </div>

      <p className="mt-3 flex items-start gap-1.5 text-[10px] leading-relaxed text-[#1C1C1A]/60">
        <Lock size={11} strokeWidth={2} className="mt-0.5 shrink-0" />
        Session-locked: {user.email}. Right-click is disabled and links expire
        after 60 seconds.
      </p>
    </Modal>
  );
}