import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, Lock, RefreshCw } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext.jsx';
import Modal from './Modal.jsx';
import PdfRenderer from './PdfRenderer.jsx';
import { CategoryTag, TypeBadge } from './ui.jsx';

// Fixed diagonal email watermark across the entire viewing surface.
function Watermark({ email, light = false }) {
  const cells = Array.from({ length: 12 });
  return (
    <div className="pointer-events-none select-none absolute inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 grid grid-cols-3 grid-rows-4 place-items-center gap-4 rotate-[-12deg] scale-110">
        {cells.map((_, i) => (
          <span
            key={i}
            className={
              'font-black uppercase tracking-tight text-sm whitespace-nowrap ' +
              (light ? 'text-white/20' : 'text-[#1C1C1A] opacity-15')
            }
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
    <Modal title={`Secure viewer — ${content.title}`} onClose={onClose} width="max-w-6xl w-[95vw]" fit>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-[#1C1C1A]/15 bg-white px-3 py-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <TypeBadge type={content.type} />
          <CategoryTag category={content.category} />
          <span className="max-w-[320px] truncate text-[11px] font-bold uppercase tracking-tight text-[#1C1C1A]">
            {content.title}
          </span>
        </div>

        {access && (
          <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-zinc-400">
            <span
              className={
                'inline-block h-1.5 w-1.5 rounded-full ' +
                (expired ? 'bg-zinc-400' : countdown <= 10 ? 'bg-amber-500' : 'bg-emerald-500')
              }
            />
            <span className="font-medium">Protected Link</span>
            <span aria-hidden="true">&middot;</span>
            <span>{expired ? 'Expired' : `Expires in ${countdown}s`}</span>
          </span>
        )}
      </div>

      <div
        onContextMenu={blockContext}
        className="relative flex h-full min-h-0 flex-1 select-none overflow-hidden bg-[#1e1e1c]"
      >
        {loading && (
          <div className="grid h-full w-full place-items-center bg-[#1e1e1c]">
            <div className="flex flex-col items-center gap-3">
              <span className="inline-flex items-center gap-2 border-2 border-[#1C1C1A] bg-white px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] shadow-[4px_4px_0px_0px_#1C1C1A]">
                <Loader2 size={14} strokeWidth={2} className="animate-spin" />
                Decrypting and initializing preview...
              </span>
              <div className="w-52 space-y-1.5">
                <div className="h-2 bg-[#1C1C1A]/10 animate-pulse" />
                <div className="h-2 bg-[#1C1C1A]/10 animate-pulse w-3/4 mx-auto" />
              </div>
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="grid h-full w-full place-items-center bg-[#1e1e1c]">
            <div className="border-2 border-[#C1272D] bg-white px-4 py-3 text-center">
              <p className="inline-flex items-center gap-2 font-black uppercase tracking-tight text-xs text-[#C1272D]">
                <AlertTriangle size={14} strokeWidth={2} /> {error}
              </p>
            </div>
          </div>
        )}

        {!loading && !error && access && content.type === 'video' && (
          <div className="relative grid h-full w-full place-items-center bg-black">
            <video
              src={access.signedUrl}
              controls
              controlsList="nodownload"
              disablePictureInPicture
              className="max-h-full max-w-full"
            />
            <Watermark email={user.email} light />
          </div>
        )}

        {!loading && !error && access && content.type === 'pdf' && (
          <div className="relative h-full w-full">
            <PdfRenderer signedUrl={access.signedUrl} expired={expired} />
            {!expired && <Watermark email={user.email} />}
            <span className="absolute bottom-3 left-3 z-[60] inline-flex items-center gap-1 border border-white/15 bg-[#1C1C1A]/95 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-tight text-zinc-300 backdrop-blur">
              <Lock size={10} strokeWidth={2} /> No download
            </span>
          </div>
        )}

        {!loading && !error && access && content.type === 'html' && (
          <div className="relative h-full w-full">
            {expired ? (
              <div className="grid h-full place-items-center border-2 border-[#1C1C1A] bg-white text-center">
                <div>
                  <p className="font-black uppercase tracking-tight text-sm text-[#C1272D]">Link expired</p>
                  <p className="mt-1 text-xs text-[#1C1C1A]/70">
                    Use the Refresh link button above to continue viewing.
                  </p>
                </div>
              </div>
            ) : (
              <iframe
                src={access.signedUrl}
                sandbox="allow-scripts"
                title={content.title}
                className="h-full w-full bg-white border-0"
              />
            )}
            {!expired && <Watermark email={user.email} />}
          </div>
        )}
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-[#1C1C1A]/15 bg-white px-3 py-1.5">
        <p className="flex items-center gap-1.5 text-[10px] leading-relaxed text-zinc-400">
          <Lock size={10} strokeWidth={2} className="shrink-0" />
          Session-locked: {user.email} &middot; right-click disabled
        </p>

        {access && (expired || countdown <= 10) && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-500">
              {expired ? 'Session expired' : `Expires in ${countdown}s`}
            </span>
            <button
              onClick={refreshLink}
              className="inline-flex items-center gap-1 border-2 border-[#1C1C1A] bg-[#002FA7] px-2 py-0.5 text-[10px] font-black uppercase tracking-tight text-white shadow-[2px_2px_0px_0px_#1C1C1A] active:translate-x-[2px] active:translate-y-[2px] cursor-pointer"
            >
              <RefreshCw size={12} strokeWidth={2} /> Refresh Preview
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
