import { Link } from "react-router-dom";
import { MENU_LINKS } from "./HamburgerMenu";

export default function GlobalDesktopSidebar() {
  return (
    <aside className="hidden md:flex w-64 bg-[#111] border-r border-slate-800 flex-col shrink-0 shadow-2xl z-50 font-['Comic_Sans_MS',_'Chalkboard_SE',_'Marker_Felt',_cursive]">
      <div className="h-20 flex items-center px-6 border-b border-slate-800 shrink-0">
        <h2 className="text-2xl font-bold tracking-tight text-white">Admin</h2>
      </div>
      <div className="flex flex-col gap-1 p-4 overflow-y-auto flex-1">
        {MENU_LINKS.map((link) => (
          <Link
            key={link.label}
            to={link.to}
            className="px-4 py-2 text-slate-200 border border-transparent hover:border-orange-500/70 transition-all rounded-[4px] text-lg tracking-wide hover:bg-orange-500/5 hover:text-white"
          >
            {link.label}
          </Link>
        ))}
      </div>
      <div className="p-4 border-t border-slate-800">
        <Link 
          to="/pos/floor" 
          className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-base font-bold transition-colors font-sans"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8"/><path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7"/><path d="m2.1 21.8 6.4-6.3"/><path d="m19 5-7 7"/></svg>
          POS Terminal
        </Link>
      </div>
    </aside>
  );
}
