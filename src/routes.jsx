import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleGuard from "@/components/RoleGuard";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import BeneficiariesPage from "@/pages/BeneficiariesPage";
import BeneficiaryDetailPage from "@/pages/BeneficiaryDetailPage";
import NewBeneficiaryPage from "@/pages/NewBeneficiaryPage";
import EditBeneficiaryPage from "@/pages/EditBeneficiaryPage";
import DiagnosticPage from "@/pages/DiagnosticPage";
import DiagnosticResultPage from "@/pages/DiagnosticResultPage";
import ModulesPage from "@/pages/ModulesPage";
import WorkshopsPage from "@/pages/WorkshopsPage";
import AttendancePage from "@/pages/AttendancePage";
import NotesPage from "@/pages/NotesPage";
import ImpactStatsPage from "@/pages/ImpactStatsPage";
import ExportPage from "@/pages/ExportPage";
import SettingsPage from "@/pages/SettingsPage";
import RgpdPage from "@/pages/RgpdPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<LandingPage />} path="/" />
      <Route element={<LoginPage />} path="/login" />
      <Route element={<RgpdPage />} path="/rgpd" />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />} path="/app">
          <Route element={<Navigate replace to="dashboard" />} index />
          <Route element={<DashboardPage />} path="dashboard" />
          <Route element={<BeneficiariesPage />} path="beneficiaries" />
          <Route element={<NewBeneficiaryPage />} path="beneficiaries/new" />
          <Route element={<BeneficiaryDetailPage />} path="beneficiaries/:beneficiaryId" />
          <Route element={<EditBeneficiaryPage />} path="beneficiaries/:beneficiaryId/edit" />
          <Route
            element={<DiagnosticPage />}
            path="beneficiaries/:beneficiaryId/diagnostics/new"
          />
          <Route
            element={<DiagnosticResultPage />}
            path="beneficiaries/:beneficiaryId/diagnostics/:diagnosticId"
          />
          <Route element={<ModulesPage />} path="beneficiaries/:beneficiaryId/modules" />
          <Route element={<NotesPage />} path="beneficiaries/:beneficiaryId/notes" />
          <Route element={<WorkshopsPage />} path="workshops" />
          <Route element={<AttendancePage />} path="workshops/:workshopId/attendance" />
          <Route element={<ImpactStatsPage />} path="stats" />
          <Route element={<ExportPage />} path="exports" />
          <Route element={<RgpdPage />} path="rgpd" />
          <Route element={<RoleGuard allowedRoles={["administrateur"]} />}>
            <Route element={<SettingsPage />} path="settings" />
          </Route>
        </Route>
      </Route>
      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
  );
}
