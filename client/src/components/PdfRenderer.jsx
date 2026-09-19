import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Loader2, Minus, Plus } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// The worker must come from a stable CDN pinned to the exact installed
// version — bundling it via Vite imports breaks in production builds.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

const RENDER_ERROR =
  'Unable to render document. Link may have expired. Please close and re-open.';

const ZOOM_MIN = 0.75;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.25;

export default function PdfRenderer({ signedUrl, expired }) {
  const containerRef = useRef(null);
  const canvasRefs = useRef({});
  const docRef = useRef(null);
  const genRef = useRef(0);
  const tasksRef = useRef([]);

  const [numPages, setNumPages] = useState(null);
  const [renderedPages, setRenderedPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  // Draws every page sequentially onto its canvas, sized to the container.
  const renderAll = useCallback(async () => {
    const doc = docRef.current;
    const container = containerRef.current;
    if (!doc || !container) return;

    const gen = ++genRef.current;
    tasksRef.current.forEach((t) => {
      try {
        t.cancel();
      } catch {
        /* already settled */
      }
    });
    tasksRef.current = [];

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssWidth = Math.max(280, container.clientWidth - 32);
    // Preserve the reader's position across zoom/resize re-renders.
    const scrollRatio =
      container.scrollHeight > 0 ? container.scrollTop / container.scrollHeight : 0;

    for (let n = 1; n <= doc.numPages; n++) {
      if (gen !== genRef.current) return;
      try {
        const page = await doc.getPage(n);
        if (gen !== genRef.current) return;

        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({
          scale: (cssWidth / base.width) * dpr * zoom,
        });
        const canvas = canvasRefs.current[n];
        if (!canvas) continue;

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.style.width = `${Math.floor(viewport.width / dpr)}px`;
        canvas.style.height = `${Math.floor(viewport.height / dpr)}px`;

        const task = page.render({
          canvasContext: canvas.getContext('2d'),
          viewport,
        });
        tasksRef.current.push(task);
        await task.promise;
        tasksRef.current = tasksRef.current.filter((t) => t !== task);
        setRenderedPages(n);
      } catch (err) {
        if (gen !== genRef.current || err?.name === 'RenderingCancelledException') return;
        console.error('[PdfRenderer Error]:', err);
        setError(RENDER_ERROR);
        return;
      }
    }

    container.scrollTop = scrollRatio * container.scrollHeight;
  }, [zoom]);

  // Fetches the document through the short-lived signed URL. No credentials
  // are attached: auth lives entirely in the signed query params.
  useEffect(() => {
    if (expired) return;
    let cancelled = false;
    genRef.current++;
    setLoading(true);
    setError(null);
    setNumPages(null);
    setRenderedPages(0);

    const task = pdfjsLib.getDocument({ url: signedUrl, isEvalSupported: false });
    task.promise
      .then((doc) => {
        if (cancelled) {
          doc.destroy();
          return;
        }
        docRef.current = doc;
        setNumPages(doc.numPages);
      })
      .catch((err) => {
        console.error('[PdfRenderer Error]:', err);
        if (!cancelled) setError(RENDER_ERROR);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      genRef.current++;
      tasksRef.current.forEach((t) => {
        try {
          t.cancel();
        } catch {
          /* already settled */
        }
      });
      tasksRef.current = [];
      task.destroy();
      docRef.current = null;
    };
  }, [signedUrl, expired]);

  // Render pages once the document and its placeholders exist, and re-render
  // whenever the zoom level changes.
  useEffect(() => {
    if (numPages > 0) renderAll();
  }, [numPages, zoom, renderAll]);

  // Re-fit pages when the viewport resizes (debounced).
  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;
    let timer;
    const observer = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (docRef.current) renderAll();
      }, 250);
    });
    observer.observe(container);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [renderAll, numPages]);

  // Derives the page currently filling the viewport, for the toolbar readout.
  const updateCurrentPage = useCallback(() => {
    const container = containerRef.current;
    if (!container || !numPages) return;
    const mid = container.scrollTop + container.clientHeight / 2;
    let best = 1;
    let bestDist = Infinity;
    for (let n = 1; n <= numPages; n++) {
      const canvas = canvasRefs.current[n];
      if (!canvas) continue;
      const center = canvas.offsetTop + canvas.offsetHeight / 2;
      const dist = Math.abs(center - mid);
      if (dist < bestDist) {
        bestDist = dist;
        best = n;
      }
    }
    setCurrentPage(best);
  }, [numPages]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        updateCurrentPage();
      });
    };
    container.addEventListener('scroll', onScroll, { passive: true });
    updateCurrentPage();
    return () => {
      container.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [updateCurrentPage, renderedPages]);

  if (expired) {
    return (
      <div className="grid h-full w-full place-items-center bg-[#1e1e1c]">
        <div className="border border-white/15 bg-white px-6 py-4 text-center shadow-md">
          <p className="font-black uppercase tracking-tight text-sm text-[#C1272D]">Link expired</p>
          <p className="mt-1 text-xs text-[#1C1C1A]/70">
            Use the Refresh Preview button below to request a fresh 60-second link.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid h-full w-full place-items-center bg-[#1e1e1c]">
        <div className="max-w-sm border border-white/15 bg-white px-6 py-4 text-center shadow-md">
          <p className="inline-flex items-center gap-2 font-black uppercase tracking-tight text-xs text-[#C1272D]">
            <AlertTriangle size={14} strokeWidth={2} /> Render failed
          </p>
          <p className="mt-2 text-xs leading-relaxed text-[#1C1C1A]/80">{error}</p>
        </div>
      </div>
    );
  }

  if (loading || !numPages) {
    return (
      <div className="grid h-full w-full place-items-center bg-[#1e1e1c]">
        <div className="flex flex-col items-center gap-3">
          <span className="inline-flex items-center gap-2 border-2 border-[#1C1C1A] bg-white px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] shadow-[4px_4px_0px_0px_#1C1C1A]">
            <Loader2 size={14} strokeWidth={2} className="animate-spin" />
            Preparing pages...
          </span>
          <div className="w-48 space-y-1.5">
            <div className="h-2 bg-white/15 animate-pulse" />
            <div className="h-2 bg-white/15 animate-pulse w-3/4 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      {/* Floating reading toolbar — dark, top-center, keeps the stage uncluttered */}
      <div className="absolute left-1/2 top-3 z-[60] flex -translate-x-1/2 items-stretch divide-x divide-white/15 border border-white/15 bg-[#1C1C1A]/95 text-white shadow-lg backdrop-blur">
        <button
          onClick={() => setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2)))}
          disabled={zoom <= ZOOM_MIN}
          aria-label="Zoom out"
          title="Zoom out"
          className="grid h-8 w-8 place-items-center hover:bg-white/10 disabled:opacity-35 cursor-pointer"
        >
          <Minus size={13} strokeWidth={2.5} />
        </button>
        <button
          onClick={() => setZoom(1)}
          disabled={zoom === 1}
          aria-label="Reset zoom to fit"
          title="Reset / Fit"
          className="h-8 px-2.5 font-mono text-[10px] uppercase tracking-tight hover:bg-white/10 disabled:opacity-60 cursor-pointer"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          onClick={() => setZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2)))}
          disabled={zoom >= ZOOM_MAX}
          aria-label="Zoom in"
          title="Zoom in"
          className="grid h-8 w-8 place-items-center hover:bg-white/10 disabled:opacity-35 cursor-pointer"
        >
          <Plus size={13} strokeWidth={2.5} />
        </button>
        <span className="flex select-none items-center whitespace-nowrap px-2.5 font-mono text-[10px] uppercase tracking-tight text-zinc-300">
          Page {Math.min(currentPage, numPages)} of {numPages}
        </span>
      </div>

      {/* The one and only scroll container for the document */}
      <div
        ref={containerRef}
        className="relative h-full w-full flex-1 overflow-auto bg-[#1e1e1c] p-4"
      >
        <div className="mx-auto flex w-fit flex-col items-center gap-4">
          {Array.from({ length: numPages }).map((_, i) => (
            <canvas
              key={i}
              ref={(el) => {
                canvasRefs.current[i + 1] = el;
              }}
              className="block bg-white shadow-md"
            />
          ))}
        </div>
      </div>

      {renderedPages < numPages && (
        <span className="absolute bottom-3 right-3 z-[60] inline-flex items-center gap-1.5 border border-white/15 bg-[#1C1C1A]/95 px-2 py-1 font-mono text-[10px] uppercase tracking-tight text-zinc-300 backdrop-blur">
          <Loader2 size={11} strokeWidth={2} className="animate-spin" />
          Rendering {renderedPages + 1} / {numPages}
        </span>
      )}
    </div>
  );
}
