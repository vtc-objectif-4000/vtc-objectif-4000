import { useEffect, useState } from "react";
import Card from "@/components/Card";
import Pill from "@/components/Pill";
import { APP_CONFIG } from "@/config/appConfig";
import { useAppContext } from "@/context/AppContext";
import { listUsers } from "@/services/userService";

export default function SettingsPage() {
  const { profile, isConfigured } = useAppContext();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    listUsers()
      .then((data) => {
        if (active) {
          setUsers(data);
        }
      })
      .catch((loadError) => {
        if (active) {
          setError(loadError.message);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Parametres globaux</h1>
        <p className="page-subtitle">
          Espace reserve aux administrateurs pour la configuration de l'organisation, le controle
          des acces et la preparation du deploiement.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-coral-500">
            Configuration
          </p>
          <div className="mt-5 space-y-3 text-sm text-slate-700">
            <p>Application : {APP_CONFIG.appName}</p>
            <p>Support : {APP_CONFIG.supportEmail}</p>
            <p>Supabase configure : {isConfigured ? "Oui" : "Non"}</p>
            <p>Version de politique RGPD : {APP_CONFIG.rgpdPolicyVersion}</p>
            <p>Organisation staff : {profile.organization?.name || "Non renseignee"}</p>
          </div>
        </Card>

        <Card>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-coral-500">
            Equipe staff
          </p>
          {error ? (
            <p className="mt-4 text-sm text-coral-500">{error}</p>
          ) : (
            <div className="mt-5 space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col gap-3 rounded-[22px] bg-sand-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-pine-900">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-sm text-slate-600">{user.email}</p>
                  </div>
                  <Pill className="bg-white text-pine-900">{user.role}</Pill>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-coral-500">
          Checklist de deploiement
        </p>
        <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-700">
          <li>• Executer le schema SQL, les policies RLS et le seed de demonstration.</li>
          <li>• Configurer les variables d'environnement Vite et les URLs d'authentification.</li>
          <li>• Verifier les profils staff relies a l'organisation.</li>
          <li>• Activer les redirects de production et la revue des logs d'audit.</li>
        </ul>
      </Card>
    </div>
  );
}
