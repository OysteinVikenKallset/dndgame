import { type FormEvent, type ReactElement, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ApiError } from "../../api-client";
import { mapErrorToMessage } from "../common/errors";
import { Button } from "../common/ui/Button";
import { Card } from "../common/ui/Card";
import { FormField } from "../common/ui/FormField";
import { TextInput } from "../common/ui/TextInput";
import { PageHeader } from "../layout/PageHeader";
import type { SessionStatus } from "../common/types";

type LoginPageProps = {
  onLogin: (input: {
    email: string;
    password: string;
  }) => Promise<ApiError | null>;
  isSubmitting: boolean;
  sessionStatus: SessionStatus;
  loginDisabled: boolean;
  error: ApiError | null;
};

export function LoginPage({
  onLogin,
  isSubmitting,
  sessionStatus,
  loginDisabled,
  error,
}: LoginPageProps): ReactElement {
  const navigate = useNavigate();
  const [email, setEmail] = useState("alice@example.com");
  const [password, setPassword] = useState("password123");
  const [rateLimited, setRateLimited] = useState(false);

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      navigate("/pages", { replace: true });
    }
  }, [navigate, sessionStatus]);

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const result = await onLogin({ email, password });

    if (result?.status === 429) {
      setRateLimited(true);
      return;
    }

    setRateLimited(false);
  }

  return (
    <main className="app-shell app-shell--narrow">
      <PageHeader title="Sign in" meta="Use your CMS account to continue" />

      <Card>
        <form className="ui-stack" onSubmit={submit}>
          <FormField label="Email" htmlFor="email" required>
            <TextInput
              id="email"
              autoComplete="username"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setRateLimited(false);
              }}
              required
            />
          </FormField>

          <FormField label="Password" htmlFor="password" required>
            <TextInput
              id="password"
              autoComplete="current-password"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setRateLimited(false);
              }}
              required
            />
          </FormField>

          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            disabled={loginDisabled || rateLimited}
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        {rateLimited ? (
          <p
            className="ui-inline-message ui-inline-message--error"
            role="alert"
          >
            Too many attempts, try again soon.
          </p>
        ) : null}

        {error ? (
          <p
            className="ui-inline-message ui-inline-message--error"
            role="alert"
          >
            {mapErrorToMessage(error)}
          </p>
        ) : null}
      </Card>
    </main>
  );
}
