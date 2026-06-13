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
    </aside>
  );
}
