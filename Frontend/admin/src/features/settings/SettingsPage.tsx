import {
  type Dispatch,
  type ReactElement,
  type SetStateAction,
  useEffect,
  useState,
} from "react";
import { api, type PageListItemDto } from "../../api-client";
import { mapErrorToMessage } from "../common/errors";
import { setToastError } from "../common/toast";
import type { Toast } from "../common/types";
import { Button } from "../common/ui/Button";
import { Card } from "../common/ui/Card";
import { FormField } from "../common/ui/FormField";
import { PageHeader } from "../layout/PageHeader";

type SettingsPageProps = {
  onUnauthorized: () => void;
  csrfBlocked: boolean;
  csrfToken: string | null;
  setToast: Dispatch<SetStateAction<Toast | null>>;
};

export function SettingsPage({
  onUnauthorized,
  csrfBlocked,
  csrfToken,
  setToast,
}: SettingsPageProps): ReactElement {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [pages, setPages] = useState<PageListItemDto[]>([]);
  const [selectedHomepagePageId, setSelectedHomepagePageId] = useState("");

  async function loadSettings(): Promise<void> {
    setLoading(true);
    setError("");

    const [settingsResult, pagesResult] = await Promise.all([
      api.getSettings(),
      api.listPages({ status: "PUBLISHED", limit: 100 }),
    ]);

    if (!settingsResult.ok) {
      if (settingsResult.error.status === 401) {
        onUnauthorized();
        return;
      }

      if (settingsResult.error.status === 403) {
        setError("Access denied. Only admins can change CMS settings.");
        setLoading(false);
        return;
      }

      if (settingsResult.error.status === 404) {
        setError(
          "Settings endpoint not found. Restart backend to load latest routes.",
        );
        setLoading(false);
        return;
      }

      setError(mapErrorToMessage(settingsResult.error));
      setLoading(false);
      return;
    }

    if (!pagesResult.ok) {
      if (pagesResult.error.status === 401) {
        onUnauthorized();
        return;
      }

      setError(mapErrorToMessage(pagesResult.error));
      setLoading(false);
      return;
    }

    const items = Array.isArray(pagesResult.data.items)
      ? pagesResult.data.items
      : [];

    setPages(items);
    setSelectedHomepagePageId(settingsResult.data.homepagePageId ?? "");
    setLoading(false);
  }

  useEffect(() => {
    void loadSettings();
  }, []);

  async function onSave(): Promise<void> {
    if (csrfBlocked) {
      setToastError(setToast, "CSRF token missing; backend misconfigured");
      return;
    }

    setSaving(true);

    const result = await api.updateSettings(
      {
        homepagePageId: selectedHomepagePageId || null,
      },
      csrfToken,
    );

    setSaving(false);

    if (!result.ok) {
      if (result.error.status === 401) {
        onUnauthorized();
        return;
      }

      setToastError(setToast, mapErrorToMessage(result.error));
      return;
    }

    setToast({ type: "success", message: "Settings saved" });
  }

  if (loading) {
    return <p className="ui-inline-message">Loading settings...</p>;
  }

  if (error) {
    return (
      <Card>
        <p className="ui-inline-message ui-inline-message--error" role="alert">
          {error}
        </p>
        <Button onClick={() => void loadSettings()}>Retry</Button>
      </Card>
    );
  }

  return (
    <>
      <PageHeader title="Settings" meta="Configure CMS-wide content behavior" />
      <Card>
        <FormField
          label="Homepage"
          htmlFor="homepagePageId"
          hint="Choose which published page should be used as the website front page."
        >
          <select
            id="homepagePageId"
            className="ui-select"
            value={selectedHomepagePageId}
            onChange={(event) => setSelectedHomepagePageId(event.target.value)}
          >
            <option value="">Use automatic fallback</option>
            {pages.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title} ({item.slug})
              </option>
            ))}
          </select>
        </FormField>

        {pages.length === 0 ? (
          <p className="ui-inline-message" role="status">
            No published pages available yet. Publish a page first to select it
            as homepage.
          </p>
        ) : null}

        <div style={{ marginTop: "var(--s-4)" }}>
          <Button
            variant="primary"
            onClick={() => void onSave()}
            loading={saving}
          >
            Save settings
          </Button>
        </div>
      </Card>
    </>
  );
}
