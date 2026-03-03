import type { ReactElement, ReactNode } from "react";
import { NavLink } from "react-router-dom";
import type { MeDto } from "../../api-client";
import type { Toast } from "../common/types";
import { Button } from "../common/ui/Button";

type AppLayoutProps = {
  user: Pick<MeDto, "displayName" | "email" | "role">;
  onLogout: () => void;
  logoutPending: boolean;
  toast: Toast | null;
  onDismissToast: () => void;
  csrfWarning: string;
  children: ReactNode;
};

export function AppLayout({
  user,
  onLogout,
  logoutPending,
  toast,
  onDismissToast,
  csrfWarning,
  children,
}: AppLayoutProps): ReactElement {
  const toastClassName =
    toast?.type === "success"
      ? "ui-alert ui-alert--success"
      : toast?.type === "error"
        ? "ui-alert ui-alert--error"
        : "ui-alert ui-alert--info";

  return (
    <main className="app-shell">
      <header className="topbar">
        <nav className="topbar__nav" aria-label="Primary">
          <NavLink
            className={({ isActive }) => (isActive ? "active" : "")}
            to="/pages"
          >
            Pages
          </NavLink>
          <NavLink
            className={({ isActive }) => (isActive ? "active" : "")}
            to="/pages/new"
          >
            Create page
          </NavLink>
          <NavLink
            className={({ isActive }) => (isActive ? "active" : "")}
            to="/settings"
          >
            Settings
          </NavLink>
          <NavLink
            className={({ isActive }) => (isActive ? "active" : "")}
            to="/menu"
          >
            Menu
          </NavLink>
          <NavLink
            className={({ isActive }) => (isActive ? "active" : "")}
            to="/me"
          >
            My page
          </NavLink>
        </nav>

        <div className="topbar__user">
          <span className="topbar__user-name">
            {user.displayName || user.email}
          </span>
          <Button
            variant="secondary"
            onClick={onLogout}
            loading={logoutPending}
          >
            {logoutPending ? "Signing out..." : "Sign out"}
          </Button>
        </div>
      </header>

      {toast ? (
        <div className="ui-toast">
          <div
            role={toast.type === "error" ? "alert" : "status"}
            aria-live={toast.type === "error" ? "assertive" : "polite"}
            className={toastClassName}
          >
            <span>{toast.message}</span>
            <button
              type="button"
              className="ui-alert__dismiss"
              onClick={onDismissToast}
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        </div>
      ) : null}

      {csrfWarning && (
        <p className="ui-alert ui-alert--warning" role="alert">
          {csrfWarning}
        </p>
      )}

      {children}
    </main>
  );
}
