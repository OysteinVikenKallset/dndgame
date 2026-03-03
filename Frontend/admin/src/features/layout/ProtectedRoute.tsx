import type { ReactElement, ReactNode } from "react";
import { Navigate } from "react-router-dom";
import type { SessionStatus } from "../common/types";

type ProtectedRouteProps = {
  sessionStatus: SessionStatus;
  children: ReactNode;
};

export function ProtectedRoute({
  sessionStatus,
  children,
}: ProtectedRouteProps): ReactElement {
  if (sessionStatus === "unknown") {
    return (
      <main className="app-shell">
        <p className="ui-inline-message">Checking session...</p>
      </main>
    );
  }

  if (sessionStatus === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
