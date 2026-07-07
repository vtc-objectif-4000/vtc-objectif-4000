import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import Card from "./Card";
import LoadingState from "./LoadingState";

export default function ProtectedRoute() {
  const { session, loading, isConfigured, profile } = useAppContext();
  const location = useLocation();

  if (loading) {
    return <LoadingState fullScreen label="Connexion a l'espace staff..." />;
  }

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-sand-50 p-6">
        <Card className="mx-auto mt-16 max-w-2xl">
          <h2 className="font-serif text-3xl text-pine-900">Supabase non configure</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Renseignez d'abord les variables d'environnement VITE_SUPABASE_URL et
            VITE_SUPABASE_ANON_KEY pour activer l'authentification et la base de donnees.
          </p>
        </Card>
      </div>
    );
  }

  if (!session) {
    return <Navigate replace state={{ from: location.pathname }} to="/login" />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-sand-50 p-6">
        <Card className="mx-auto mt-16 max-w-2xl">
          <h2 className="font-serif text-3xl text-pine-900">Profil staff introuvable</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Le compte existe dans Supabase Auth mais aucun profil staff n'est rattache.
            Creez la ligne correspondante dans la table profiles.
          </p>
        </Card>
      </div>
    );
  }

  return <Outlet />;
}
