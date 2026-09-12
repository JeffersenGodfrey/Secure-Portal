export const btn =
  'inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-tight ' +
  'px-3 py-1.5 border-2 border-[#1C1C1A] ' +
  'shadow-[2px_2px_0px_0px_#1C1C1A] transition-transform duration-75 ' +
  'active:translate-x-[2px] active:translate-y-[2px] cursor-pointer';

export const btnPrimary = `${btn} bg-[#002FA7] text-[#FBF9F5]`;
export const btnGhost = `${btn} bg-[#FBF9F5] text-[#1C1C1A]`;
export const btnDanger = `${btn} bg-[#C1272D] text-white`;

export function RoleBadge({ role }) {
  const admin = role === 'admin';
  return (
    <span
      className={
        'inline-grid place-items-center min-w-[64px] border-2 border-[#1C1C1A] px-2 py-0.5 ' +
        (admin ? 'bg-[#002FA7] text-white' : 'bg-white text-[#1C1C1A]')
      }
    >
      <span className="text-[10px] font-black uppercase tracking-[0.15em]">
        {admin ? 'ADMIN' : 'VIEWER'}
      </span>
    </span>
  );
}

export function TypeBadge({ type }) {
  const style = {
    video: 'bg-[#002FA7] text-white',
    pdf: 'bg-[#1C1C1A] text-white',
    html: 'bg-white text-[#1C1C1A]',
  }[type] || 'bg-white text-[#1C1C1A]';

  return (
    <span className={`inline-grid place-items-center min-w-[52px] border-2 border-[#1C1C1A] px-2 py-0.5 ${style}`}>
      <span className="text-[10px] font-black uppercase tracking-[0.15em]">{type}</span>
    </span>
  );
}

export function CategoryTag({ category }) {
  if (!category) return null;
  return (
    <span className="inline-flex items-center border-2 border-[#1C1C1A] bg-white px-2 py-0.5">
      <span className="text-[10px] font-bold uppercase tracking-tight text-[#002FA7]">
        #{category}
      </span>
    </span>
  );
}