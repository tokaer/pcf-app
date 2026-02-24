import { Outlet, NavLink, useLocation } from "react-router-dom";

export function AppLayout() {
  const location = useLocation();
  const current = location.pathname;
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="text-xl font-semibold">PCF App</div>
          <nav className="flex gap-6 text-sm">
            <TabLink to="/" label="Canvas" current={current} exact />
            <TabLink to="/db" label="Datenbank" current={current} />
            <TabLink to="/results" label="Ergebnisse" current={current} />
            <TabLink to="/report" label="Report" current={current} />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

function TabLink({ to, label, current, exact = false }: { to: string; label: string; current: string; exact?: boolean }) {
  const active = exact ? current === "/" && to === "/" : current.startsWith(to);
  return (
    <NavLink to={to} className={active ? "text-blue-600 font-medium" : "text-gray-600 hover:text-gray-900"}>
      {label}
    </NavLink>
  );
}
