import {
  type Dispatch,
  type FormEvent,
  type ReactElement,
  type SetStateAction,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  api,
  type PageDetailsDto,
  type PreviewPageDto,
} from "../../api-client";
import { extractFieldErrors, mapErrorToMessage } from "../common/errors";
import { setToastError } from "../common/toast";
import type {
  FieldErrors,
  PageComponent,
  PageFormValues,
  SubmitState,
  Toast,
} from "../common/types";
import { validatePageInput } from "../common/validation";
import { Button } from "../common/ui/Button";
import { Card } from "../common/ui/Card";
import { ConfirmModal } from "../common/ui/ConfirmModal";
import { PageHeader } from "../layout/PageHeader";
import { PageEditorFields } from "./PageEditorFields";

type EditPageProps = {
  csrfBlocked: boolean;
  csrfToken: string | null;
  onUnauthorized: () => void;
  setToast: Dispatch<SetStateAction<Toast | null>>;
};

export function EditPage({
  csrfBlocked,
  csrfToken,
  onUnauthorized,
  setToast,
}: EditPageProps): ReactElement {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState<PageDetailsDto | null>(null);
  const [values, setValues] = useState<PageFormValues>({
    title: "",
    slug: "",
    template: "page",
    showInNav: true,
    components: [],
    bodyRichText: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [publishState, setPublishState] = useState<SubmitState>("idle");
  const [unpublishState, setUnpublishState] = useState<SubmitState>("idle");
  const [archiveState, setArchiveState] = useState<SubmitState>("idle");
  const [previewData, setPreviewData] = useState<PreviewPageDto | null>(null);
  const [previewState, setPreviewState] = useState<SubmitState>("idle");
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);

  async function hydrateMediaUrls(
    components: PageFormValues["components"],
  ): Promise<PageFormValues["components"]> {
    const result = await api.listMedia();

    if (!result.ok) {
      return components;
    }

    const mediaById = new Map(
      result.data.map((asset) => [asset.id, asset.url]),
    );

    let changed = false;

    const nextComponents = components.map((component) => {
      if (component.componentType === "image") {
        const hasUrl = component.props.url.trim().length > 0;

        if (hasUrl || component.props.mediaId.trim().length === 0) {
          return component;
        }

        const resolvedUrl = mediaById.get(component.props.mediaId);

        if (!resolvedUrl) {
          return component;
        }

        return {
          componentType: "image" as const,
          props: {
            ...component.props,
            url: resolvedUrl,
          },
        };
      }

      if (component.componentType === "textImage") {
        const hasUrl = component.props.url.trim().length > 0;

        if (hasUrl || component.props.mediaId.trim().length === 0) {
          return component;
        }

        const resolvedUrl = mediaById.get(component.props.mediaId);

        if (!resolvedUrl) {
          return component;
        }

        return {
          componentType: "textImage" as const,
          props: {
            ...component.props,
            url: resolvedUrl,
          },
        };
      }

      return component;
    });

    for (let index = 0; index < components.length; index += 1) {
      if (nextComponents[index] !== components[index]) {
        changed = true;
        break;
      }
    }

    return changed ? nextComponents : components;
  }

  function normalizeComponents(
    components: PageDetailsDto["components"],
  ): PageComponent[] {
    if (!Array.isArray(components)) {
      return [];
    }

    return components
      .map((component) => {
        if (component.componentType === "richText") {
          const html = component.props["html"];

          if (typeof html === "string") {
            return {
              componentType: "richText" as const,
              props: { html },
            };
          }
        }

        if (component.componentType === "image") {
          const mediaId = component.props["mediaId"];
          const url = component.props["url"];
          const alt = component.props["alt"];
          const caption = component.props["caption"];

          if (typeof mediaId === "string" && typeof alt === "string") {
            return {
              componentType: "image" as const,
              props: {
                mediaId,
                url: typeof url === "string" ? url : "",
                alt,
                ...(typeof caption === "string" ? { caption } : {}),
              },
            };
          }
        }

        if (component.componentType === "textImage") {
          const title = component.props["title"];
          const text = component.props["text"];
          const mediaId = component.props["mediaId"];
          const url = component.props["url"];
          const alt = component.props["alt"];
          const layout = component.props["layout"];

          if (
            typeof text === "string" &&
            typeof mediaId === "string" &&
            typeof alt === "string" &&
            (layout === "imageLeft" || layout === "imageRight")
          ) {
            return {
              componentType: "textImage" as const,
              props: {
                ...(typeof title === "string" ? { title } : {}),
                text,
                mediaId,
                url: typeof url === "string" ? url : "",
                alt,
                layout,
              },
            };
          }
        }

        if (component.componentType === "quote") {
          const quote = component.props["quote"];
          const author = component.props["author"];

          if (typeof quote === "string") {
            return {
              componentType: "quote" as const,
              props: {
                quote,
                ...(typeof author === "string" ? { author } : {}),
              },
            };
          }
        }

        return null;
      })
      .filter((entry): entry is PageComponent => entry !== null);
  }

  const initialSnapshot = useMemo(
    () =>
      JSON.stringify({
        title: page?.title ?? "",
        slug: page?.slug ?? "",
        template: page?.template ?? "page",
        showInNav: page?.showInNav ?? true,
        components: page?.components ?? [],
        bodyRichText: page?.bodyRichText ?? "",
      }),
    [page],
  );
  const currentSnapshot = JSON.stringify(values);
  const isDirty = page !== null && initialSnapshot !== currentSnapshot;

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!isDirty) {
        return;
      }

      event.preventDefault();
      event.returnValue = "You have unsaved changes";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  async function loadPage(): Promise<void> {
    if (!id) {
      setLoadError("Not found.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError("");
    const result = await api.getPageById(id);

    if (!result.ok) {
      if (result.error.status === 401) {
        onUnauthorized();
        return;
      }

      setLoadError(mapErrorToMessage(result.error));
      setLoading(false);
      return;
    }

    setPage(result.data);
    setValues({
      title: result.data.title,
      slug: result.data.slug,
      template: result.data.template === "post" ? "post" : "page",
      showInNav: result.data.showInNav ?? true,
      components: normalizeComponents(result.data.components),
      bodyRichText: result.data.bodyRichText ?? "",
    });
    setLoading(false);
  }

  useEffect(() => {
    void loadPage();
  }, [id]);

  async function save(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!page || !id) {
      return;
    }

    const nextErrors = validatePageInput(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setToastError(setToast, "Fix validation errors.");
      return;
    }

    if (csrfBlocked) {
      setToastError(setToast, "CSRF token missing; backend misconfigured");
      return;
    }

    setSubmitState("submitting");
    const hydratedComponents = await hydrateMediaUrls(values.components);

    if (hydratedComponents !== values.components) {
      setValues((previous) => ({
        ...previous,
        components: hydratedComponents,
      }));
    }

    const result = await api.updatePage(
      id,
      {
        version: page.version,
        title: values.title,
        slug: values.slug,
        template: values.template === "post" ? "post" : "page",
        showInNav: values.showInNav,
        components: hydratedComponents,
        bodyRichText: values.bodyRichText,
      },
      csrfToken,
    );

    if (!result.ok) {
      setSubmitState("error");
      if (result.error.status === 401) {
        onUnauthorized();
        return;
      }

      setErrors(extractFieldErrors(result.error));
      setToastError(setToast, mapErrorToMessage(result.error));
      return;
    }

    setSubmitState("success");
    setToast({ type: "success", message: "Saved" });
    await loadPage();
    setTimeout(() => setSubmitState("idle"), 600);
  }

  async function publish(): Promise<void> {
    if (!page || !id || page.status !== "DRAFT") {
      return;
    }

    const validationErrors = validatePageInput(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (csrfBlocked) {
      setToastError(setToast, "CSRF token missing; backend misconfigured");
      return;
    }

    setPublishState("submitting");
    const result = await api.publishPage(id, csrfToken);

    if (!result.ok) {
      setPublishState("error");
      if (result.error.status === 401) {
        onUnauthorized();
        return;
      }

      setToastError(setToast, mapErrorToMessage(result.error));
      return;
    }

    setPublishState("success");
    setToast({ type: "success", message: "Published" });
    await loadPage();
    setTimeout(() => setPublishState("idle"), 600);
  }

  async function archive(): Promise<void> {
    if (!id) {
      return;
    }

    if (csrfBlocked) {
      setToastError(setToast, "CSRF token missing; backend misconfigured");
      return;
    }

    setArchiveState("submitting");
    const result = await api.archivePage(id, csrfToken);

    if (!result.ok) {
      setArchiveState("error");
      if (result.error.status === 401) {
        onUnauthorized();
        return;
      }

      setToastError(setToast, mapErrorToMessage(result.error));
      return;
    }

    setArchiveState("success");
    setToast({ type: "success", message: "Archived" });
    await loadPage();
    setTimeout(() => setArchiveState("idle"), 600);
  }

  async function unpublish(): Promise<void> {
    if (!page || !id || page.status !== "PUBLISHED") {
      return;
    }

    if (csrfBlocked) {
      setToastError(setToast, "CSRF token missing; backend misconfigured");
      return;
    }

    setUnpublishState("submitting");
    const result = await api.unpublishPage(id, csrfToken);

    if (!result.ok) {
      setUnpublishState("error");
      if (result.error.status === 401) {
        onUnauthorized();
        return;
      }

      setToastError(setToast, mapErrorToMessage(result.error));
      return;
    }

    setUnpublishState("success");
    setToast({ type: "success", message: "Unpublished" });
    await loadPage();
    setTimeout(() => setUnpublishState("idle"), 600);
  }

  async function loadPreview(): Promise<void> {
    if (!id) {
      return;
    }

    setPreviewState("submitting");
    const result = await api.previewPage(id);

    if (!result.ok) {
      if (result.error.status === 401) {
        onUnauthorized();
        return;
      }

      setPreviewState("error");
      setToastError(setToast, mapErrorToMessage(result.error));
      return;
    }

    setPreviewData(result.data);
    setPreviewState("success");
  }

  if (loading) {
    return <p className="ui-inline-message">Loading page...</p>;
  }

  if (loadError) {
    return (
      <Card>
        <p className="ui-inline-message ui-inline-message--error" role="alert">
          {loadError}
        </p>
        <Button onClick={() => void loadPage()}>Retry</Button>
      </Card>
    );
  }

  const disableAll =
    submitState === "submitting" ||
    publishState === "submitting" ||
    unpublishState === "submitting" ||
    archiveState === "submitting";
  const publishDisabled =
    !page ||
    disableAll ||
    page.status !== "DRAFT" ||
    Object.keys(validatePageInput(values)).length > 0;
  const unpublishDisabled = !page || disableAll || page.status !== "PUBLISHED";

  return (
    <>
      <PageHeader
        title="Edit page"
        meta={
          page?.publishedAt
            ? `Published ${new Date(page.publishedAt).toLocaleString()}`
            : "Draft page"
        }
      />

      <Card className="editor-layout">
        <div className="editor-shell">
          <form id="edit-page-form" className="ui-stack" onSubmit={save}>
            <PageEditorFields
              values={values}
              setValues={setValues}
              errors={errors}
              disabled={disableAll}
              status={page?.status}
              version={page?.version}
              csrfBlocked={csrfBlocked}
              csrfToken={csrfToken}
            />

            <div className="editor-form-actions">
              <Button
                type="submit"
                variant="primary"
                loading={submitState === "submitting"}
                disabled={disableAll}
              >
                {submitState === "submitting" ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>

          <aside className="editor-sidebar" aria-label="Page actions">
            <Button
              variant="secondary"
              onClick={() => void publish()}
              loading={publishState === "submitting"}
              disabled={publishDisabled}
            >
              {publishState === "submitting" ? "Publishing..." : "Publish"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => void unpublish()}
              loading={unpublishState === "submitting"}
              disabled={unpublishDisabled}
            >
              {unpublishState === "submitting"
                ? "Unpublishing..."
                : "Unpublish"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setArchiveModalOpen(true)}
              disabled={disableAll}
            >
              Archive
            </Button>
          </aside>
        </div>

        <div
          className="page-header__actions"
          style={{ marginTop: "var(--s-4)" }}
        >
          <Button
            variant="secondary"
            onClick={() => void loadPreview()}
            loading={previewState === "submitting"}
            disabled={disableAll}
          >
            {previewState === "submitting" ? "Loading preview..." : "Preview"}
          </Button>
          <Button
            onClick={() => {
              if (isDirty && !window.confirm("You have unsaved changes")) {
                return;
              }

              navigate("/pages");
            }}
          >
            Back to pages
          </Button>
        </div>

        <p className="ui-inline-message">
          Public endpoint: /api/content/pages/{values.slug}?locale=en
        </p>

        {isDirty ? (
          <p className="ui-inline-message">You have unsaved changes</p>
        ) : null}
      </Card>

      {previewData ? (
        <Card
          subtle
          className="editor-layout"
          style={{ marginTop: "var(--s-4)" }}
        >
          <p className="editor-section-title">Preview</p>
          <pre>{JSON.stringify(previewData, null, 2)}</pre>
        </Card>
      ) : null}

      <ConfirmModal
        open={archiveModalOpen}
        title="Archive page"
        message="Are you sure you want to archive this page?"
        confirmLabel="Archive"
        onCancel={() => setArchiveModalOpen(false)}
        onConfirm={() => {
          void archive();
          setArchiveModalOpen(false);
        }}
      />
    </>
  );
}
