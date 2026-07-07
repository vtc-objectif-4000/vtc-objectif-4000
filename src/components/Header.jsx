import { useNavigate } from "react-router-dom";
import { APP_CONFIG, ROLE_LABELS } from "@/config/appConfig";
import { useAppContext } from "@/context/AppContext";
import Button from "./Button";
import BeneficiarySelector from "./BeneficiarySelector";
import Pill from "./Pill";

export default function Header() {
  const { profile, logout, authBootError } = useAppContext();
  const navigate = useNavigate();

  return (
    <header className="space-y-4">
      <div className="rounded-[28px] border border-coral-100 bg-coral-100/70 px-5 py-4 text-sm font-semibold text-coral-500 shadow-soft">
        {APP_CONFIG.demoBannerText}
      </div>
      <div className="flex flex-col gap-4 rounded-[32px] border border-white/70 bg-white/85 px-6 py-5 shadow-soft backdrop-blur xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-coral-500">
            Association et financeurs
          </p>
          <h2 className="mt-2 font-serif text-3xl text-pine-900">Pilotage de l'accompagnement</h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
            Les donnees sont cloisonnees par organisation, les acces sont limites par role et les
            formulaires imposent le consentement RGPD.
          </p>
          {authBootError ? (
            <p className="mt-3 text-sm font-medium text-coral-500">{authBootError}</p>
          ) : null}
        </div>
        <div className="flex flex-col gap-4 xl:items-end">
          <div className="flex flex-wrap items-center gap-3">
            <Pill>{ROLE_LABELS[profile?.role] || "Staff"}</Pill>
            <div className="text-right text-sm text-slate-600">
              <p className="font-semibold text-pine-900">
                {profile?.first_name} {profile?.last_name}
              </p>
              <p>{profile?.organization?.name || "Organisation non rattachee"}</p>
            </div>
            <Button
              variant="secondary"
              onClick={async () => {
                await logout();
                navigate("/login");
              }}
            >
              Deconnexion
            </Button>
          </div>
          <BeneficiarySelector />
        </div>
      </div>
    </header>
  );
}
