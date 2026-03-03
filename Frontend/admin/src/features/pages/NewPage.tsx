import {
  type Dispatch,
  type FormEvent,
  type ReactElement,
  type SetStateAction,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api-client";
import { extractFieldErrors, mapErrorToMessage } from "../common/errors";
import { setToastError } from "../common/toast";
import type { FieldErrors, PageFormValues, Toast } from "../common/types";
import { generateSlugFromTitle, validatePageInput } from "../common/validation";
import { Button } from "../common/ui/Button";
import { Card } from "../common/ui/Card";
import { PageHeader } from "../layout/PageHeader";
import { PageEditorFields } from "./PageEditorFields";

type NewPageProps = {
  csrfBlocked: boolean;
  csrfToken: string | null;
  onUnauthorized: () => void;
  setToast: Dispatch<SetStateAction<Toast | null>>;
};

export function NewPage({
  csrfBlocked,
  csrfToken,
  onUnauthorized,
  setToast,
}: NewPageProps): ReactElement {
  const navigate = useNavigate();
  const [values, setValues] = useState<PageFormValues>({
    title: "",
    slug: "",
    template: "page",
    showInNav: true,
    components: [
      {
        componentType: "richText",
        props: {
          html: "",
        },
      },
    ],
    bodyRichText: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  function handleTitleBlur(): void {
    if (values.slug.trim().length > 0) {
      return;
    }

    const generatedSlug = generateSlugFromTitle(values.title);

    if (!generatedSlug) {
      return;
    }

    setValues((previous) => ({
      ...previous,
      slug: generatedSlug,
    }));
  }

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
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

    setIsSubmitting(true);
    const hydratedComponents = await hydrateMediaUrls(values.components);

    if (hydratedComponents !== values.components) {
      setValues((previous) => ({
        ...previous,
        components: hydratedComponents,
      }));
    }

    const result = await api.createPage(
      {
        title: values.title,
        slug: values.slug,
        locale: "en",
        template: values.template,
        showInNav: values.showInNav,
        components: hydratedComponents,
        bodyRichText: values.bodyRichText,
      },
      csrfToken,
    );
    setIsSubmitting(false);

    if (!result.ok) {
      if (result.error.status === 401) {
        onUnauthorized();
        return;
      }

      setErrors(extractFieldErrors(result.error));
      setToastError(setToast, mapErrorToMessage(result.error));
      return;
    }

    setToast({ type: "success", message: "Saved" });
    navigate(`/pages/${result.data.id}`);
  }

  return (
    <>
      <PageHeader title="Create page" meta="Create a new draft in locale en" />
      <Card className="editor-layout">
        <form className="ui-stack" onSubmit={submit}>
          <PageEditorFields
            values={values}
            setValues={setValues}
            errors={errors}
            disabled={isSubmitting}
            onTitleBlur={handleTitleBlur}
            csrfBlocked={csrfBlocked}
            csrfToken={csrfToken}
          />

          <div>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
