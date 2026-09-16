import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ title, onClose, children, width = 'max-w-2xl', fit = false }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-[#1C1C1A]/60 grid place-items-center p-4 overflow-y-auto"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full ${width} bg-[#FBF9F5] border-2 border-[#1C1C1A] shadow-[6px_6px_0px_0px_#1C1C1A] max-h-[90vh] ${fit ? 'overflow-hidden' : 'overflow-y-auto'}`}
      >
        <div className="flex items-center justify-between border-b-2 border-[#1C1C1A] px-4 py-3 bg-white">
          <h2 className="font-black uppercase tracking-tight text-sm text-[#1C1C1A]">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="grid place-items-center h-7 w-7 border-2 border-[#1C1C1A] bg-[#FBF9F5] hover:bg-[#002FA7] hover:text-white active:translate-x-[2px] active:translate-y-[2px] cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>
        <div className="px-4 py-4">{children}</div>
      </div>
    </div>
  );
}