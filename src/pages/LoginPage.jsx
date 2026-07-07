import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "@/components/Button";
import Card from "@/components/Card";
import { DEMO_ACCOUNTS } from "@/data/demoData";
import { useAppContext } from "@/context/AppContext";
import { signInWithPassword } from "@/services/authService";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, isConfigured } = useAppContext();
  const [formState, setFormState] = useState({
    email: DEMO_ACCOUNTS[0].email,
    password: DEMO_ACCOUNTS[0].password,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (session) {
      navigate("/app/dashboard", { replace: true });
    }
  }, [navigate, session]);

  return (
    <div className="min-h-screen bg-sand-50 bg-brand-glow px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="bg-pine-900 text-white">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-coral-100">
            Connexion staff
          </p>
          <h1 className="mt-4 text-4xl text-white">Acceder a l'espace securise</h1>
          <p className="mt-4 text-sm leading-7 text-white/75">
            Authentification Supabase, profils staff relies a l'organisation, acces limites par
            role et policies RLS sur chaque table sensible.
          </p>
          <div className="mt-8 space-y-4">
            {DEMO_ACCOUNTS.map((account) => (
              <div key={account.email} className="rounded-[24px] bg-white/10 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-coral-100">
                  {account.role}
                </p>
                <p className="mt-2 font-semibold">{account.email}</p>
                <p className="text-sm text-white/75">{account.password}</p>
                <p className="mt-2 text-sm text-white/70">{account.note}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="bg-white/90">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-coral-500">
            Authentification
          </p>
          <h2 className="mt-4 text-4xl">Se connecter</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Utilisez des comptes staff preconfigures dans Supabase Auth. Le profil staff doit
            aussi exister dans la table <code>profiles</code>.
          </p>
          {!isConfigured ? (
            <div className="mt-6 rounded-[24px] border border-coral-200 bg-coral-100/80 p-4 text-sm text-coral-500">
              Configurez d'abord <code>VITE_SUPABASE_URL</code> et{" "}
              <code>VITE_SUPABASE_ANON_KEY</code> dans le fichier <code>.env</code>.
            </div>
          ) : null}
          <form
            className="mt-8 space-y-5"
            onSubmit={async (event) => {
              event.preventDefault();
              setSubmitting(true);
              setError("");

              try {
                await signInWithPassword(formState);
                navigate(location.state?.from || "/app/dashboard", { replace: true });
              } catch (submitError) {
                setError(submitError.message);
              } finally {
                setSubmitting(false);
              }
            }}
          >
            <div>
              <label className="field-label" htmlFor="email">
                Email
              </label>
              <input
                className="field-input"
                id="email"
                type="email"
                value={formState.email}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, email: event.target.value }))
                }
              />
            </div>
            <div>
              <label className="field-label" htmlFor="password">
                Mot de passe
              </label>
              <input
                className="field-input"
                id="password"
                type="password"
                value={formState.password}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, password: event.target.value }))
                }
              />
            </div>
            {error ? (
              <div className="rounded-[20px] border border-coral-200 bg-coral-100/70 px-4 py-3 text-sm text-coral-500">
                {error}
              </div>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <Button disabled={submitting || !isConfigured} type="submit">
                {submitting ? "Connexion..." : "Se connecter"}
              </Button>
              <Button to="/" variant="secondary">
                Retour au site public
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
