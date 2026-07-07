import { Navigate, Outlet } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";

export default function RoleGuard({ allowedRoles = [] }) {
  const { profile } = useAppContext();

  if (!allowedRoles.includes(profile?.role)) {
    return <Navigate replace to="/app/dashboard" />;
  }

  return <Outlet />;
}
