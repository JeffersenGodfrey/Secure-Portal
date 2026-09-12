import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { loginWithGoogle } = useAuth();

  return (
    <div className="min-h-screen bg-[#FBF9F5] px-4 py-10 grid place-items-center">
      <div className="w-full max-w-5xl grid md:grid-cols-[1fr_300px] gap-10 items-start">

        <section className="border-2 border-[#1C1C1A] bg-[#FBF9F5] p-8 shadow-[6px_6px_0px_0px_#1C1C1A]">
          <p className="inline-block border-2 border-[#1C1C1A] bg-white px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-[#1C1C1A]">
            Internal library / access restricted
          </p>

          <h1 className="mt-8 text-4xl font-black uppercase tracking-tight leading-none text-[#1C1C1A]">
            Organization
            <br />
            Vault
          </h1>

          <p className="mt-6 max-w-xl text-sm leading-relaxed text-[#1C1C1A]/80">
            Secure content repository and reference library for authorized team members.
          </p>

          <button
            onClick={loginWithGoogle}
            className="mt-8 inline-flex items-center gap-3 bg-[#002FA7] text-white border-2 border-[#1C1C1A] px-6 py-3 font-black uppercase tracking-tight text-sm shadow-[4px_4px_0px_0px_#1C1C1A] active:translate-x-[3px] active:translate-y-[3px] cursor-pointer"
          >
            <span className="grid place-items-center h-7 w-7 bg-white text-[#1C1C1A] font-black">G</span>
            Continue with Google
          </button>
        </section>

        <aside className="border-2 border-[#1C1C1A] bg-[#FBF9F5] p-6 shadow-[6px_6px_0px_0px_#1C1C1A]">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#1C1C1A]">Role matrix</p>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between border-2 border-[#1C1C1A] bg-[#002FA7] px-3 py-2">
              <span className="text-[11px] font-black uppercase tracking-tight text-white">Admin</span>
              <span className="text-[10px] font-bold uppercase text-white">read + write</span>
            </div>
            <div className="flex items-center justify-between border-2 border-[#1C1C1A] bg-white px-3 py-2">
              <span className="text-[11px] font-black uppercase tracking-tight text-[#1C1C1A]">Viewer</span>
              <span className="text-[10px] font-bold uppercase text-[#1C1C1A]/70">read only</span>
            </div>
          </div>

          <div className="mt-6 border-2 border-[#002FA7] bg-[#FBF9F5] px-3 py-3">
            <p className="text-[10px] uppercase tracking-[0.15em] text-[#1C1C1A]">Link TTL</p>
            <p className="mt-1 text-2xl font-black tracking-tight text-[#1C1C1A]">60s</p>
          </div>
        </aside>
      </div>
    </div>
  );
}