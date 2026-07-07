import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";

export default function Layout() {
  return (
    <div className="min-h-screen bg-sand-50 bg-brand-glow text-slate-800">
      <div className="mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[280px_minmax(0,1fr)]">
        <Sidebar />
        <div className="px-4 py-4 sm:px-6 lg:px-8">
          <Header />
          <main className="mt-6 pb-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
