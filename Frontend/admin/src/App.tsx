import { type ReactElement, useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { api, type ApiError, type MeDto } from "./api-client";
import { LoginPage } from "./features/auth/LoginPage";
import { MyProfilePage } from "./features/account/MyProfilePage";
import type { SessionStatus, Toast } from "./features/common/types";
import { setToastError } from "./features/common/toast";
import { AppLayout } from "./features/layout/AppLayout";
import { ProtectedRoute } from "./features/layout/ProtectedRoute";
import { EditPage } from "./features/pages/EditPage";
import { NewPage } from "./features/pages/NewPage";
import { PagesListPage } from "./features/pages/PagesListPage";
import { PreviewRoute } from "./features/pages/PreviewRoute";
import { MenuPage } from "./features/settings/MenuPage";
import { SettingsPage } from "./features/settings/SettingsPage";

export function App(): ReactElement {
  const navigate = useNavigate();
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("unknown");
  const [user, setUser] = useState<MeDto | null>(null);
  const [loginError, setLoginError] = useState<ApiError | null>(null);
  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  const enforceCsrfFailFast =
    import.meta.env.VITE_ENFORCE_CSRF_FAIL_FAST === "true";
  const csrfBlocked = enforceCsrfFailFast && !csrfToken;
  const csrfWarning = !csrfToken
    ? "CSRF token missing; backend misconfigured. Set VITE_ENFORCE_CSRF_FAIL_FAST=true to block mutations."
    : "";

  async function bootstrapSession(): Promise<void> {
    try {
      const result = await api.getMe();

      if (result.csrfToken) {
        setCsrfToken(result.csrfToken);
      }

      if (!result.ok) {
        setSessionStatus("unauthenticated");
        setUser(null);
        return;
      }

      setSessionStatus("authenticated");
      setUser(result.data);
    } catch {
      setSessionStatus("unauthenticated");
      setUser(null);
    }
  }

  useEffect(() => {
    void bootstrapSession();
  }, []);

  function onUnauthorized(): void {
    setSessionStatus("unauthenticated");
    setUser(null);
    navigate("/login", { replace: true });
  }

  async function onLogin(input: {
    email: string;
    password: string;
  }): Promise<ApiError | null> {
    setIsLoginSubmitting(true);
    setLoginError(null);

    const result = await api.login(input, csrfToken);
    setIsLoginSubmitting(false);

    if (!result.ok) {
      setLoginError(result.error);
      return result.error;
    }

    await bootstrapSession();
    setToast({ type: "success", message: "Logged in" });
    return null;
  }

  async function onLogout(): Promise<void> {
    if (csrfBlocked) {
      setToastError(setToast, "CSRF token missing; backend misconfigured");
      return;
    }

    setLogoutPending(true);
    const result = await api.logout(csrfToken);
    setLogoutPending(false);

    if (!result.ok && result.error.status !== 401) {
      setToastError(setToast, result.error.message);
      return;
    }

    setSessionStatus("unauthenticated");
    setUser(null);
    navigate("/login", { replace: true });
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <LoginPage
            onLogin={onLogin}
            isSubmitting={isLoginSubmitting}
            sessionStatus={sessionStatus}
            loginDisabled={false}
            error={loginError}
          />
        }
      />

      <Route
        path="/*"
        element={
          <ProtectedRoute sessionStatus={sessionStatus}>
            <AppLayout
              user={user ?? { displayName: "", email: "", role: "editor" }}
              onLogout={onLogout}
              logoutPending={logoutPending}
              toast={toast}
              onDismissToast={() => setToast(null)}
              csrfWarning={csrfWarning}
            >
              <Routes>
                <Route path="/" element={<Navigate to="/pages" replace />} />
                <Route
                  path="/pages"
                  element={
                    <PagesListPage
                      onUnauthorized={onUnauthorized}
                      csrfBlocked={csrfBlocked}
                      csrfToken={csrfToken}
                      setToast={setToast}
                    />
                  }
                />
                <Route
                  path="/pages/archived"
                  element={
                    <PagesListPage
                      mode="archived"
                      onUnauthorized={onUnauthorized}
                      csrfBlocked={csrfBlocked}
                      csrfToken={csrfToken}
                      setToast={setToast}
                    />
                  }
                />
                <Route
                  path="/pages/new"
                  element={
                    <NewPage
                      onUnauthorized={onUnauthorized}
                      csrfBlocked={csrfBlocked}
                      csrfToken={csrfToken}
                      setToast={setToast}
                    />
                  }
                />
                <Route
                  path="/pages/:id"
                  element={
                    <EditPage
                      onUnauthorized={onUnauthorized}
                      csrfBlocked={csrfBlocked}
                      csrfToken={csrfToken}
                      setToast={setToast}
                    />
                  }
                />
                <Route
                  path="/pages/:id/preview"
                  element={<PreviewRoute onUnauthorized={onUnauthorized} />}
                />
                <Route
                  path="/menu"
                  element={
                    <MenuPage
                      onUnauthorized={onUnauthorized}
                      csrfBlocked={csrfBlocked}
                      csrfToken={csrfToken}
                      setToast={setToast}
                    />
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <SettingsPage
                      onUnauthorized={onUnauthorized}
                      csrfBlocked={csrfBlocked}
                      csrfToken={csrfToken}
                      setToast={setToast}
                    />
                  }
                />
                <Route
                  path="/me"
                  element={
                    <MyProfilePage
                      user={
                        user ?? {
                          id: "",
                          email: "",
                          displayName: "",
                          role: "editor",
                        }
                      }
                      csrfBlocked={csrfBlocked}
                      csrfToken={csrfToken}
                      onUnauthorized={onUnauthorized}
                      setToast={setToast}
                      onProfileUpdated={(nextUser) => setUser(nextUser)}
                    />
                  }
                />
                <Route path="*" element={<Navigate to="/pages" replace />} />
              </Routes>
            </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
