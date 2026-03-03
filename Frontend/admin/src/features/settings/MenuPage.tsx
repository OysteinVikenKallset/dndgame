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

type MenuPageProps = {
  onUnauthorized: () => void;
  csrfBlocked: boolean;
  csrfToken: string | null;
  setToast: Dispatch<SetStateAction<Toast | null>>;
};

function togglePageId(pageIds: string[], pageId: string): string[] {
  if (pageIds.includes(pageId)) {
    return pageIds.filter((entry) => entry !== pageId);
  }

  return [...pageIds, pageId];
}

export function MenuPage({
  onUnauthorized,
  csrfBlocked,
  csrfToken,
  setToast,
}: MenuPageProps): ReactElement {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [pages, setPages] = useState<PageListItemDto[]>([]);
  const [headerMenuAll, setHeaderMenuAll] = useState(true);
  const [footerMenuAll, setFooterMenuAll] = useState(true);
  const [headerMenuPageIds, setHeaderMenuPageIds] = useState<string[]>([]);
  const [footerMenuPageIds, setFooterMenuPageIds] = useState<string[]>([]);

  async function loadMenuSettings(): Promise<void> {
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
        setError("Access denied. Only admins can change CMS menu settings.");
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

    const publishedPages = Array.isArray(pagesResult.data.items)
      ? pagesResult.data.items
      : [];

    setPages(publishedPages);
    setHeaderMenuAll(settingsResult.data.headerMenuAll);
    setHeaderMenuPageIds(settingsResult.data.headerMenuPageIds);
    setFooterMenuAll(settingsResult.data.footerMenuAll);
    setFooterMenuPageIds(settingsResult.data.footerMenuPageIds);
    setLoading(false);
  }

  useEffect(() => {
    void loadMenuSettings();
  }, []);

  async function onSave(): Promise<void> {
    if (csrfBlocked) {
      setToastError(setToast, "CSRF token missing; backend misconfigured");
      return;
    }

    setSaving(true);

    const result = await api.updateSettings(
      {
        headerMenuAll,
        headerMenuPageIds,
        footerMenuAll,
        footerMenuPageIds,
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

    setToast({ type: "success", message: "Menu settings saved" });
  }

  if (loading) {
    return <p className="ui-inline-message">Loading menu settings...</p>;
  }

  if (error) {
    return (
      <Card>
        <p className="ui-inline-message ui-inline-message--error" role="alert">
          {error}
        </p>
        <Button onClick={() => void loadMenuSettings()}>Retry</Button>
      </Card>
    );
  }

  return (
    <>
      <PageHeader
        title="Menu"
        meta="Define which published pages appear in header and footer navigation"
      />
      <Card>
        <FormField
          label="Header menu"
          htmlFor="headerMenuAll"
          hint="Choose all published pages, or pick specific pages for the header."
        >
          <div>
            <label className="ui-checkbox" htmlFor="headerMenuAll">
              <input
                id="headerMenuAll"
                type="checkbox"
                checked={headerMenuAll}
                onChange={(event) => setHeaderMenuAll(event.target.checked)}
              />
              <span>All</span>
            </label>

            {!headerMenuAll ? (
              <div
                style={{
                  display: "grid",
                  gap: "var(--s-2)",
                  marginTop: "var(--s-2)",
                }}
              >
                {pages.map((page) => (
                  <label
                    key={`header-${page.id}`}
                    className="ui-checkbox"
                    htmlFor={`header-page-${page.id}`}
                  >
                    <input
                      id={`header-page-${page.id}`}
                      type="checkbox"
                      checked={headerMenuPageIds.includes(page.id)}
                      onChange={() =>
                        setHeaderMenuPageIds((current) =>
                          togglePageId(current, page.id),
                        )
                      }
                    />
                    <span>
                      {page.title} ({page.slug})
                    </span>
                  </label>
                ))}
              </div>
            ) : null}
          </div>
        </FormField>

        <FormField
          label="Footer menu"
          htmlFor="footerMenuAll"
          hint="Choose all published pages, or pick specific pages for the footer."
        >
          <div>
            <label className="ui-checkbox" htmlFor="footerMenuAll">
              <input
                id="footerMenuAll"
                type="checkbox"
                checked={footerMenuAll}
                onChange={(event) => setFooterMenuAll(event.target.checked)}
              />
              <span>All</span>
            </label>

            {!footerMenuAll ? (
              <div
                style={{
                  display: "grid",
                  gap: "var(--s-2)",
                  marginTop: "var(--s-2)",
                }}
              >
                {pages.map((page) => (
                  <label
                    key={`footer-${page.id}`}
                    className="ui-checkbox"
                    htmlFor={`footer-page-${page.id}`}
                  >
                    <input
                      id={`footer-page-${page.id}`}
                      type="checkbox"
                      checked={footerMenuPageIds.includes(page.id)}
                      onChange={() =>
                        setFooterMenuPageIds((current) =>
                          togglePageId(current, page.id),
                        )
                      }
                    />
                    <span>
                      {page.title} ({page.slug})
                    </span>
                  </label>
                ))}
              </div>
            ) : null}
          </div>
        </FormField>

        {pages.length === 0 ? (
          <p className="ui-inline-message" role="status">
            No published pages available yet. Publish pages to configure menu
            items.
          </p>
        ) : null}

        <div style={{ marginTop: "var(--s-4)" }}>
          <Button
            variant="primary"
            onClick={() => void onSave()}
            loading={saving}
          >
            Save menu
          </Button>
        </div>
      </Card>
    </>
  );
}
