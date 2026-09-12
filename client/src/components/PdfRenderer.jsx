import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs';
import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.mjs?url';

GlobalWorkerOptions.workerSrc = workerUrl;

export default function PdfRenderer({ signedUrl, expired }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);
  const docRef = useRef(null);

  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const [error, setError] = useState(null);

  const renderPage = useCallback(
    async (pageNumber) => {
      const doc = docRef.current;
      if (!doc) return;
      const page = await doc.getPage(pageNumber);
      const base = page.getViewport({ scale: 1 });
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssWidth = Math.max(300, (containerRef.current?.clientWidth || 700) - 32);
      const scale = (cssWidth / base.width) * dpr;

      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.style.width = `${Math.floor(viewport.width / dpr)}px`;
      canvas.style.height = `${Math.floor(viewport.height / dpr)}px`;

      const task = page.render({ canvasContext: canvas.getContext('2d'), viewport });
      renderTaskRef.current = task;
      try {
        await task.promise;
      } catch (err) {
        if (err?.name !== 'RenderingCancelledException') throw err;
      }
    },
    []
  );

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setPageNum(1);
    setNumPages(null);

    async function load() {
      try {
        const task = getDocument({ url: signedUrl, withCredentials: true });
        docRef.current = await task.promise;
        if (cancelled) {
          docRef.current?.destroy();
          return;
        }
        setNumPages(docRef.current.numPages);
        await renderPage(1);
      } catch {
        if (!cancelled) setError('Could not load this PDF.');
      }
    }
    load();

    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel();
      docRef.current?.destroy();
      docRef.current = null;
    };
  }, [signedUrl, renderPage]);

  async function goTo(next) {
    const target = Math.max(1, Math.min(next, numPages || 1));
    if (target === pageNum) return;
    renderTaskRef.current?.cancel();
    setPageNum(target);
    try {
      await renderPage(target);
    } catch {
      setError('Could not render this page.');
    }
  }

  if (expired) {
    return (
      <div className="grid place-items-center h-48 border-2 border-[#1C1C1A] bg-white px-4 py-8 text-center">
        <div>
          <p className="font-black uppercase tracking-tight text-sm text-[#C1272D]">Link expired</p>
          <p className="mt-1 text-xs text-[#1C1C1A]/70">Re-open the item to request a fresh 60-second link.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-[#1C1C1A]">
      <div
        ref={containerRef}
        className="bg-[#E9E5DE] p-4 overflow-auto max-h-[62vh] grid place-items-center"
      >
        {error ? (
          <p className="border-2 border-[#C1272D] bg-white px-4 py-2 text-xs font-bold uppercase tracking-tight text-[#C1272D]">
            {error}
          </p>
        ) : (
          <canvas ref={canvasRef} className="bg-white border-2 border-[#1C1C1A]" />
        )}
      </div>

      <div className="flex items-center justify-between border-t-2 border-[#1C1C1A] bg-white px-2 py-1.5">
        <button
          onClick={() => goTo(pageNum - 1)}
          disabled={pageNum <= 1}
          className="inline-flex items-center gap-1 border-2 border-[#1C1C1A] bg-[#FBF9F5] px-2 py-1 text-[10px] font-black uppercase tracking-tight active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-40 cursor-pointer"
        >
          <ChevronLeft size={13} strokeWidth={2} /> Prev
        </button>
        <span className="font-mono text-[11px] uppercase tracking-tight text-[#1C1C1A]">
          Page {pageNum} / {numPages || '…'}
        </span>
        <button
          onClick={() => goTo(pageNum + 1)}
          disabled={!numPages || pageNum >= numPages}
          className="inline-flex items-center gap-1 border-2 border-[#1C1C1A] bg-[#FBF9F5] px-2 py-1 text-[10px] font-black uppercase tracking-tight active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-40 cursor-pointer"
        >
          Next <ChevronRight size={13} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}