import {
  type Dispatch,
  type ReactElement,
  type SetStateAction,
  useState,
} from "react";
import { api, type MeDto } from "../../api-client";
import { mapErrorToMessage } from "../common/errors";
import { setToastError } from "../common/toast";
import type { Toast } from "../common/types";
import { Button } from "../common/ui/Button";
import { Card } from "../common/ui/Card";
import { FormField } from "../common/ui/FormField";
import { TextInput } from "../common/ui/TextInput";
import { PageHeader } from "../layout/PageHeader";

type MyProfilePageProps = {
  user: Pick<MeDto, "id" | "email" | "displayName" | "role">;
  csrfBlocked: boolean;
  csrfToken: string | null;
  onUnauthorized: () => void;
  setToast: Dispatch<SetStateAction<Toast | null>>;
  onProfileUpdated: (nextUser: MeDto) => void;
};

function normalizedRole(
  role: string | undefined,
): "admin" | "editor" | "viewer" {
  if (role === "admin" || role === "viewer") {
    return role;
  }

  return "editor";
}

export function MyProfilePage({
  user,
  csrfBlocked,
  csrfToken,
  onUnauthorized,
  setToast,
  onProfileUpdated,
}: MyProfilePageProps): ReactElement {
  const [email, setEmail] = useState(user.email);
  const [displayName, setDisplayName] = useState(user.displayName ?? "");
  const [role, setRole] = useState<"admin" | "editor" | "viewer">(
    normalizedRole(user.role),
  );
  const [saving, setSaving] = useState(false);

  function clearToast(): void {
    setToast(null);
  }

  async function onSave(): Promise<void> {
    if (csrfBlocked) {
      setToastError(setToast, "CSRF token missing; backend misconfigured");
      return;
    }

    setSaving(true);

    const normalizedEmail = email.trim();
    const normalizedDisplayName = displayName.trim();

    if (normalizedEmail.length === 0) {
      setToastError(setToast, "Email is required.");
      return;
    }

    const updatePayload: {
      email: string;
      role: "admin" | "editor" | "viewer";
      displayName?: string;
    } = {
      email: normalizedEmail,
      role,
      ...(normalizedDisplayName.length > 0
        ? { displayName: normalizedDisplayName }
        : {}),
    };

    const result = await api.updateMyProfile(updatePayload, csrfToken);

    setSaving(false);

    if (!result.ok) {
      if (result.error.status === 401) {
        onUnauthorized();
        return;
      }

      setToastError(setToast, mapErrorToMessage(result.error));
      return;
    }

    const nextUser: MeDto = {
      id: result.data.id,
      email: result.data.email,
      displayName: result.data.displayName,
      role: result.data.role,
    };

    onProfileUpdated(nextUser);
    setEmail(nextUser.email);
    setDisplayName(nextUser.displayName);
    setRole(normalizedRole(nextUser.role));
    setToast({ type: "success", message: "Profile saved" });
  }

  return (
    <>
      <PageHeader title="My page" meta="Update your own profile" />
      <Card>
        <div className="ui-stack">
          <div>
            <p
              className="ui-inline-message"
              style={{ marginBottom: "var(--s-2)" }}
            >
              User ID: {user.id}
            </p>
          </div>

          <FormField label="Email" htmlFor="my-email" required>
            <TextInput
              id="my-email"
              value={email}
              onChange={(event) => {
                clearToast();
                setEmail(event.target.value);
              }}
              autoComplete="email"
            />
          </FormField>

          <FormField
            label="Display name"
            htmlFor="my-display-name"
            hint="Optional"
          >
            <TextInput
              id="my-display-name"
              value={displayName}
              onChange={(event) => {
                clearToast();
                setDisplayName(event.target.value);
              }}
              autoComplete="name"
            />
          </FormField>

          <FormField label="Role" htmlFor="my-role" required>
            <select
              id="my-role"
              className="ui-select"
              value={role}
              onChange={(event) => {
                clearToast();
                setRole(event.target.value as "admin" | "editor" | "viewer");
              }}
            >
              <option value="admin">admin</option>
              <option value="editor">editor</option>
              <option value="viewer">viewer</option>
            </select>
          </FormField>

          <div>
            <Button
              variant="primary"
              onClick={() => void onSave()}
              loading={saving}
            >
              Save profile
            </Button>
          </div>
        </div>
      </Card>
    </>
  );
}
