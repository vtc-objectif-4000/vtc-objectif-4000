import { NavLink } from "react-router-dom";
import { USER_ROLES } from "@/config/appConfig";
import { useAppContext } from "@/context/AppContext";
import { cn } from "@/utils/formatters";

const NAV_ITEMS = [
  { to: "/app/dashboard", label: "Tableau de bord" },
  { to: "/app/beneficiaries", label: "Beneficiaires" },
  { to: "/app/workshops", label: "Ateliers" },
  { to: "/app/stats", label: "Statistiques" },
  { to: "/app/exports", label: "Exports" },
  { to: "/app/rgpd", label: "RGPD" },
];

export default function Sidebar() {
  const { profile } = useAppContext();

  return (
    <aside className="sticky top-0 hidden h-screen w-full max-w-[280px] flex-col border-r border-white/70 bg-white/80 px-5 py-6 backdrop-blur lg:flex">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.28em] text-coral-500">
          Logix Famille
        </p>
        <h1 className="mt-3 font-serif text-3xl text-pine-900">Espace staff</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Suivi des familles, diagnostics, modules, presences et impact.
        </p>
      </div>
      <nav className="mt-10 space-y-2">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            className={({ isActive }) =>
              cn(
                "block rounded-2xl px-4 py-3 text-sm font-semibold transition",
                isActive
                  ? "bg-pine-900 text-white shadow-soft"
                  : "text-slate-600 hover:bg-pine-50 hover:text-pine-900",
              )
            }
            to={item.to}
          >
            {item.label}
          </NavLink>
        ))}
        {profile?.role === USER_ROLES.ADMIN ? (
          <NavLink
            className={({ isActive }) =>
              cn(
                "block rounded-2xl px-4 py-3 text-sm font-semibold transition",
                isActive
                  ? "bg-pine-900 text-white shadow-soft"
                  : "text-slate-600 hover:bg-pine-50 hover:text-pine-900",
              )
            }
            to="/app/settings"
          >
            Parametres
          </NavLink>
        ) : null}
      </nav>
      <div className="mt-auto rounded-[24px] bg-brand-glow p-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-pine-700">
          Rappel
        </p>
        <p className="mt-2 text-sm leading-7 text-pine-900">
          Un formateur ne peut intervenir que sur son portefeuille attribue et n'accede pas aux
          exports sensibles.
        </p>
      </div>
    </aside>
  );
}
