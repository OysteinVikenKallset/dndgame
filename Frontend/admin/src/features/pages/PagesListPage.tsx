import {
  type Dispatch,
  type ReactElement,
  type SetStateAction,
  useEffect,
  useState,
} from "react";
import { Link } from "react-router-dom";
import {
  api,
  type PageListItemDto,
  type PageListMetaDto,
} from "../../api-client";
import { mapErrorToMessage } from "../common/errors";
import { setToastError } from "../common/toast";
import type { Toast } from "../common/types";
import { Badge } from "../common/ui/Badge";
import { Button } from "../common/ui/Button";
import { Card } from "../common/ui/Card";
import { ConfirmModal } from "../common/ui/ConfirmModal";
import { PageHeader } from "../layout/PageHeader";

type PagesListPageProps = {
  onUnauthorized: () => void;
  csrfBlocked: boolean;
  csrfToken: string | null;
  setToast: Dispatch<SetStateAction<Toast | null>>;
  mode?: "default" | "archived";
};

export function PagesListPage({
  onUnauthorized,
  csrfBlocked,
  csrfToken,
  setToast,
  mode = "default",
}: PagesListPageProps): ReactElement {
  const isArchivedView = mode === "archived";
  const [statusFilter, setStatusFilter] = useState(
    isArchivedView ? "ARCHIVED" : "ALL",
  );
  const [items, setItems] = useState<PageListItemDto[]>([]);
  const [meta, setMeta] = useState<PageListMetaDto>({ total: 0 });
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorInitial, setErrorInitial] = useState("");
  const [errorMore, setErrorMore] = useState("");
  const [pendingActionId, setPendingActionId] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  async function loadPages({
    cursor,
    append = false,
  }: {
    cursor?: string;
    append?: boolean;
  } = {}): Promise<void> {
    if (append) {
      setLoadingMore(true);
      setErrorMore("");
    } else {
      setLoadingInitial(true);
      setErrorInitial("");
    }

    const result = await api.listPages({
      status: statusFilter === "ALL" ? undefined : statusFilter,
      cursor,
      limit: 20,
    });

    if (!result.ok) {
      if (result.error.status === 401) {
        onUnauthorized();
        return;
      }

      if (append) {
        setErrorMore(mapErrorToMessage(result.error));
        setLoadingMore(false);
        return;
      }

      setErrorInitial(mapErrorToMessage(result.error));
      setLoadingInitial(false);
      return;
    }

    const nextItemsRaw = Array.isArray(result.data.items)
      ? result.data.items
      : [];
    const nextItems =
      statusFilter === "ALL"
        ? nextItemsRaw.filter((item) => item.status !== "ARCHIVED")
        : nextItemsRaw;

    setItems((previous) => (append ? [...previous, ...nextItems] : nextItems));
    setMeta(
      result.data.meta ?? { nextCursor: undefined, total: nextItems.length },
    );

    setLoadingInitial(false);
    setLoadingMore(false);
  }

  useEffect(() => {
    void loadPages();
  }, [statusFilter]);

  async function deletePage(pageId: string): Promise<void> {
    if (csrfBlocked) {
      setToastError(setToast, "CSRF token missing; backend misconfigured");
      return;
    }

    setPendingActionId(pageId);
    const result = await api.deletePage(pageId, csrfToken);
    setPendingActionId("");

    if (!result.ok) {
      if (result.error.status === 401) {
        onUnauthorized();
        return;
      }

      setToastError(setToast, mapErrorToMessage(result.error));
      return;
    }

    setToast({ type: "success", message: "Deleted" });
    await loadPages();
  }

  if (loadingInitial) {
    return <p className="ui-inline-message">Loading pages...</p>;
  }

  if (errorInitial) {
    return (
      <Card>
        <p className="ui-inline-message ui-inline-message--error" role="alert">
          {errorInitial}
        </p>
        <Button onClick={() => void loadPages()}>Retry</Button>
      </Card>
    );
  }

  return (
    <>
      <PageHeader
        title={isArchivedView ? "Archived pages" : "Pages"}
        meta={
          isArchivedView
            ? "Review and clean up archived content"
            : "Manage draft and published content"
        }
        actions={
          <>
            <Link to="/pages/new" className="ui-button ui-button--primary">
              Create page
            </Link>
            <Link
              to={isArchivedView ? "/pages" : "/pages/archived"}
              className="ui-button ui-button--secondary"
            >
              {isArchivedView ? "Back to pages" : "View archived"}
            </Link>
          </>
        }
      />

      <Card className="table-card">
        {!isArchivedView ? (
          <div className="table-controls">
            <div className="ui-field">
              <label className="ui-field__label" htmlFor="status-filter">
                Status
              </label>
              <select
                id="status-filter"
                className="ui-select"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="ALL">All</option>
                <option value="DRAFT">DRAFT</option>
                <option value="PUBLISHED">PUBLISHED</option>
              </select>
            </div>
          </div>
        ) : null}

        {items.length === 0 ? (
          <div className="empty-state">
            <p>
              {statusFilter === "ARCHIVED" || isArchivedView
                ? "No archived pages."
                : "No pages yet. Create your first page to get started."}
            </p>
            {statusFilter === "ARCHIVED" || isArchivedView ? null : (
              <Link to="/pages/new" className="ui-button ui-button--primary">
                Create page
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Slug</th>
                    <th>Template</th>
                    <th>Status</th>
                    <th>Created by</th>
                    <th>Updated</th>
                    <th className="actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const isWorking = pendingActionId === item.id;
                    const deleteDisabled =
                      item.status !== "ARCHIVED" || isWorking;
                    const allowDeleteAction = isArchivedView;

                    return (
                      <tr key={item.id}>
                        <td>
                          <Link to={`/pages/${item.id}`}>{item.title}</Link>
                        </td>
                        <td>{item.slug}</td>
                        <td>{item.template ?? "page"}</td>
                        <td>
                          <Badge label={item.status} />
                        </td>
                        <td>
                          {item.createdByDisplayName ??
                            item.createdByUsername ??
                            item.createdBy}
                        </td>
                        <td>{new Date(item.updatedAt).toLocaleString()}</td>
                        <td className="actions">
                          <div className="table-actions">
                            <Link
                              to={`/pages/${item.id}`}
                              className="ui-button ui-button--ghost"
                            >
                              Edit
                            </Link>
                            {allowDeleteAction ? (
                              <Button
                                variant="danger"
                                onClick={() => setDeleteTargetId(item.id)}
                                disabled={deleteDisabled}
                              >
                                Delete
                              </Button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {meta?.nextCursor ? (
              <div style={{ marginTop: "var(--s-4)" }}>
                <Button
                  onClick={() =>
                    void loadPages({ cursor: meta.nextCursor, append: true })
                  }
                  loading={loadingMore}
                >
                  {loadingMore ? "Loading more..." : "Load more"}
                </Button>
              </div>
            ) : null}

            {errorMore ? (
              <p
                className="ui-inline-message ui-inline-message--error"
                role="alert"
              >
                {errorMore}
              </p>
            ) : null}
          </>
        )}
      </Card>

      <ConfirmModal
        open={Boolean(deleteTargetId)}
        title="Delete archived page"
        message="Are you sure you want to permanently delete this archived page?"
        confirmLabel="Delete"
        confirmVariant="danger"
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={() => {
          if (!deleteTargetId) {
            return;
          }

          void deletePage(deleteTargetId);
          setDeleteTargetId(null);
        }}
      />
    </>
  );
}
