import type { Dispatch, ReactElement, SetStateAction } from "react";
import { useMemo, useState } from "react";
import { api, type MediaAssetDto } from "../../api-client";
import type { FieldErrors, PageFormValues } from "../common/types";
import { FormField } from "../common/ui/FormField";
import { TextInput } from "../common/ui/TextInput";

type PageEditorFieldsProps = {
  values: PageFormValues;
  setValues: Dispatch<SetStateAction<PageFormValues>>;
  errors: FieldErrors;
  disabled: boolean;
  status?: string;
  version?: number;
  onTitleBlur?: () => void;
  csrfBlocked?: boolean;
  csrfToken?: string | null;
};

function defaultComponentByType(
  type: string,
): PageFormValues["components"][number] | null {
  if (type === "richText") {
    return { componentType: "richText", props: { html: "" } };
  }

  if (type === "image") {
    return {
      componentType: "image",
      props: {
        mediaId: "",
        url: "",
        alt: "",
      },
    };
  }

  if (type === "textImage") {
    return {
      componentType: "textImage",
      props: {
        title: "",
        text: "",
        mediaId: "",
        url: "",
        alt: "",
        layout: "imageLeft",
      },
    };
  }

  if (type === "quote") {
    return {
      componentType: "quote",
      props: {
        quote: "",
        author: "",
      },
    };
  }

  return null;
}

export function PageEditorFields({
  values,
  setValues,
  errors,
  disabled,
  status,
  version,
  onTitleBlur,
  csrfBlocked = false,
  csrfToken = null,
}: PageEditorFieldsProps): ReactElement {
  const [mediaItems, setMediaItems] = useState<MediaAssetDto[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState("");

  const mediaById = useMemo(
    () => new Map(mediaItems.map((item) => [item.id, item])),
    [mediaItems],
  );

  async function loadMedia(): Promise<void> {
    setMediaLoading(true);
    setMediaError("");

    const result = await api.listMedia();

    setMediaLoading(false);

    if (!result.ok) {
      setMediaError(result.error.message || "Failed to load media");
      return;
    }

    setMediaItems(result.data);
  }

  async function uploadMedia(file: File): Promise<void> {
    if (csrfBlocked) {
      setMediaError("CSRF token missing; backend misconfigured");
      return;
    }

    setMediaError("");
    setMediaLoading(true);

    const uploadResult = await api.uploadMedia(file, csrfToken);

    setMediaLoading(false);

    if (!uploadResult.ok) {
      setMediaError(uploadResult.error.message || "Media upload failed");
      return;
    }

    await loadMedia();
  }

  function addComponent(type: string): void {
    const component = defaultComponentByType(type);

    if (!component) {
      return;
    }

    setValues((previous) => ({
      ...previous,
      components: [...previous.components, component],
    }));
  }

  function removeComponent(index: number): void {
    setValues((previous) => ({
      ...previous,
      components: previous.components.filter((_, current) => current !== index),
    }));
  }

  function moveComponent(index: number, direction: -1 | 1): void {
    setValues((previous) => {
      const nextIndex = index + direction;

      if (nextIndex < 0 || nextIndex >= previous.components.length) {
        return previous;
      }

      const next = [...previous.components];
      const current = next[index];
      next[index] = next[nextIndex]!;
      next[nextIndex] = current!;

      return {
        ...previous,
        components: next,
      };
    });
  }

  function setComponent(
    index: number,
    value: PageFormValues["components"][number],
  ): void {
    setValues((previous) => ({
      ...previous,
      components: previous.components.map((entry, current) =>
        current === index ? value : entry,
      ),
    }));
  }

  return (
    <>
      <p className="editor-section-title">Page details</p>

      <div className="editor-grid">
        <FormField
          label="Title"
          htmlFor="title"
          required
          error={errors.title}
          hint="Visible heading in admin and public page"
        >
          <TextInput
            id="title"
            aria-invalid={Boolean(errors.title)}
            aria-describedby="title-hint title-error"
            value={values.title}
            onChange={(event) =>
              setValues((previous) => ({
                ...previous,
                title: event.target.value,
              }))
            }
            onBlur={onTitleBlur}
            disabled={disabled}
            required
          />
        </FormField>

        <FormField
          label="Slug"
          htmlFor="slug"
          required
          error={errors.slug}
          hint="Lowercase letters, numbers and hyphens"
        >
          <TextInput
            id="slug"
            aria-invalid={Boolean(errors.slug)}
            aria-describedby="slug-hint slug-error"
            value={values.slug}
            onChange={(event) =>
              setValues((previous) => ({
                ...previous,
                slug: event.target.value,
              }))
            }
            disabled={disabled}
            required
          />
        </FormField>

        <FormField label="Locale" htmlFor="locale" hint="MVP locale is fixed">
          <TextInput id="locale" value="en" readOnly disabled />
        </FormField>

        <FormField
          label="Template"
          htmlFor="template"
          hint="Controls public page layout"
        >
          <select
            id="template"
            className="ui-select"
            value={values.template}
            onChange={(event) =>
              setValues((previous) => ({
                ...previous,
                template: event.target.value === "post" ? "post" : "page",
              }))
            }
            disabled={disabled}
          >
            <option value="page">Page template</option>
            <option value="post">Post template</option>
          </select>
        </FormField>

        <FormField
          label="Navigation"
          htmlFor="show-in-nav"
          hint="Show this page in website header/footer navigation"
        >
          <label htmlFor="show-in-nav" className="ui-checkbox">
            <input
              id="show-in-nav"
              type="checkbox"
              checked={values.showInNav}
              onChange={(event) =>
                setValues((previous) => ({
                  ...previous,
                  showInNav: event.target.checked,
                }))
              }
              disabled={disabled}
            />
            <span>Show in navigation</span>
          </label>
        </FormField>
      </div>

      {status ? (
        <FormField label="Status" htmlFor="status">
          <TextInput id="status" value={status} readOnly disabled />
        </FormField>
      ) : null}

      {version !== undefined ? (
        <FormField label="Version" htmlFor="version">
          <TextInput id="version" value={String(version)} readOnly disabled />
        </FormField>
      ) : null}

      <p className="editor-section-title">Content</p>

      <FormField
        label="Blocks"
        htmlFor="components"
        hint="Add and reorder content blocks"
        error={errors.components}
      >
        <div className="ui-stack">
          <div className="editor-form-actions">
            <select
              id="component-type"
              className="ui-select"
              disabled={disabled}
              onChange={(event) => {
                if (!event.target.value) {
                  return;
                }

                addComponent(event.target.value);
                event.target.value = "";
              }}
              defaultValue=""
            >
              <option value="" disabled>
                Add component...
              </option>
              <option value="richText">Rich text</option>
              <option value="image">Image</option>
              <option value="textImage">Text and image</option>
              <option value="quote">Quote</option>
            </select>
            <button
              type="button"
              className="ui-button ui-button--secondary"
              onClick={() => void loadMedia()}
              disabled={disabled || mediaLoading}
            >
              {mediaLoading ? "Loading media..." : "Refresh media"}
            </button>
          </div>

          <label
            className="ui-button ui-button--secondary"
            style={{ width: "fit-content" }}
          >
            Upload image
            <input
              type="file"
              accept="image/*"
              hidden
              disabled={disabled || mediaLoading}
              onChange={(event) => {
                const file = event.target.files?.[0];

                if (!file) {
                  return;
                }

                void uploadMedia(file);
                event.target.value = "";
              }}
            />
          </label>

          {mediaError ? (
            <p
              className="ui-inline-message ui-inline-message--error"
              role="alert"
            >
              {mediaError}
            </p>
          ) : null}

          <div className="ui-stack">
            {values.components.map((component, index) => {
              if (component.componentType === "richText") {
                return (
                  <div
                    key={`component-${index}`}
                    className="ui-card ui-card--subtle ui-stack"
                  >
                    <p>
                      <strong>Rich text</strong>
                    </p>
                    <textarea
                      className="ui-textarea"
                      value={component.props.html}
                      onChange={(event) =>
                        setComponent(index, {
                          componentType: "richText",
                          props: {
                            html: event.target.value,
                          },
                        })
                      }
                      disabled={disabled}
                    />
                    <div className="editor-form-actions">
                      <button
                        type="button"
                        className="ui-button ui-button--ghost"
                        onClick={() => moveComponent(index, -1)}
                        disabled={disabled || index === 0}
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        className="ui-button ui-button--ghost"
                        onClick={() => moveComponent(index, 1)}
                        disabled={
                          disabled || index === values.components.length - 1
                        }
                      >
                        Down
                      </button>
                      <button
                        type="button"
                        className="ui-button ui-button--danger"
                        onClick={() => removeComponent(index)}
                        disabled={disabled}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              }

              if (component.componentType === "quote") {
                return (
                  <div
                    key={`component-${index}`}
                    className="ui-card ui-card--subtle ui-stack"
                  >
                    <p>
                      <strong>Quote</strong>
                    </p>
                    <input
                      className="ui-input"
                      value={component.props.quote}
                      onChange={(event) =>
                        setComponent(index, {
                          componentType: "quote",
                          props: {
                            ...component.props,
                            quote: event.target.value,
                          },
                        })
                      }
                      disabled={disabled}
                      placeholder="Quote"
                    />
                    <input
                      className="ui-input"
                      value={component.props.author ?? ""}
                      onChange={(event) =>
                        setComponent(index, {
                          componentType: "quote",
                          props: {
                            ...component.props,
                            author: event.target.value,
                          },
                        })
                      }
                      disabled={disabled}
                      placeholder="Author (optional)"
                    />
                    <div className="editor-form-actions">
                      <button
                        type="button"
                        className="ui-button ui-button--ghost"
                        onClick={() => moveComponent(index, -1)}
                        disabled={disabled || index === 0}
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        className="ui-button ui-button--ghost"
                        onClick={() => moveComponent(index, 1)}
                        disabled={
                          disabled || index === values.components.length - 1
                        }
                      >
                        Down
                      </button>
                      <button
                        type="button"
                        className="ui-button ui-button--danger"
                        onClick={() => removeComponent(index)}
                        disabled={disabled}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              }

              if (component.componentType === "image") {
                return (
                  <div
                    key={`component-${index}`}
                    className="ui-card ui-card--subtle ui-stack"
                  >
                    <p>
                      <strong>Image</strong>
                    </p>
                    <select
                      className="ui-select"
                      value={component.props.mediaId}
                      onChange={(event) => {
                        const asset = mediaById.get(event.target.value);
                        setComponent(index, {
                          componentType: "image",
                          props: {
                            ...component.props,
                            mediaId: event.target.value,
                            url: asset?.url ?? "",
                          },
                        });
                      }}
                      disabled={disabled}
                    >
                      <option value="">Select image</option>
                      {mediaItems.map((asset) => (
                        <option key={asset.id} value={asset.id}>
                          {asset.filename}
                        </option>
                      ))}
                    </select>
                    <input
                      className="ui-input"
                      value={component.props.alt}
                      onChange={(event) =>
                        setComponent(index, {
                          componentType: "image",
                          props: {
                            ...component.props,
                            alt: event.target.value,
                          },
                        })
                      }
                      disabled={disabled}
                      placeholder="Alt text"
                    />
                    <input
                      className="ui-input"
                      value={component.props.caption ?? ""}
                      onChange={(event) =>
                        setComponent(index, {
                          componentType: "image",
                          props: {
                            ...component.props,
                            caption: event.target.value,
                          },
                        })
                      }
                      disabled={disabled}
                      placeholder="Caption (optional)"
                    />
                    <div className="editor-form-actions">
                      <button
                        type="button"
                        className="ui-button ui-button--ghost"
                        onClick={() => moveComponent(index, -1)}
                        disabled={disabled || index === 0}
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        className="ui-button ui-button--ghost"
                        onClick={() => moveComponent(index, 1)}
                        disabled={
                          disabled || index === values.components.length - 1
                        }
                      >
                        Down
                      </button>
                      <button
                        type="button"
                        className="ui-button ui-button--danger"
                        onClick={() => removeComponent(index)}
                        disabled={disabled}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={`component-${index}`}
                  className="ui-card ui-card--subtle ui-stack"
                >
                  <p>
                    <strong>Text and image</strong>
                  </p>
                  <input
                    className="ui-input"
                    value={component.props.title ?? ""}
                    onChange={(event) =>
                      setComponent(index, {
                        componentType: "textImage",
                        props: {
                          ...component.props,
                          title: event.target.value,
                        },
                      })
                    }
                    disabled={disabled}
                    placeholder="Title (optional)"
                  />
                  <textarea
                    className="ui-textarea"
                    value={component.props.text}
                    onChange={(event) =>
                      setComponent(index, {
                        componentType: "textImage",
                        props: {
                          ...component.props,
                          text: event.target.value,
                        },
                      })
                    }
                    disabled={disabled}
                  />
                  <select
                    className="ui-select"
                    value={component.props.mediaId}
                    onChange={(event) => {
                      const asset = mediaById.get(event.target.value);
                      setComponent(index, {
                        componentType: "textImage",
                        props: {
                          ...component.props,
                          mediaId: event.target.value,
                          url: asset?.url ?? "",
                        },
                      });
                    }}
                    disabled={disabled}
                  >
                    <option value="">Select image</option>
                    {mediaItems.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.filename}
                      </option>
                    ))}
                  </select>
                  <input
                    className="ui-input"
                    value={component.props.alt}
                    onChange={(event) =>
                      setComponent(index, {
                        componentType: "textImage",
                        props: {
                          ...component.props,
                          alt: event.target.value,
                        },
                      })
                    }
                    disabled={disabled}
                    placeholder="Alt text"
                  />
                  <select
                    className="ui-select"
                    value={component.props.layout}
                    onChange={(event) =>
                      setComponent(index, {
                        componentType: "textImage",
                        props: {
                          ...component.props,
                          layout:
                            event.target.value === "imageRight"
                              ? "imageRight"
                              : "imageLeft",
                        },
                      })
                    }
                    disabled={disabled}
                  >
                    <option value="imageLeft">Image left</option>
                    <option value="imageRight">Image right</option>
                  </select>
                  <div className="editor-form-actions">
                    <button
                      type="button"
                      className="ui-button ui-button--ghost"
                      onClick={() => moveComponent(index, -1)}
                      disabled={disabled || index === 0}
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      className="ui-button ui-button--ghost"
                      onClick={() => moveComponent(index, 1)}
                      disabled={
                        disabled || index === values.components.length - 1
                      }
                    >
                      Down
                    </button>
                    <button
                      type="button"
                      className="ui-button ui-button--danger"
                      onClick={() => removeComponent(index)}
                      disabled={disabled}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </FormField>
    </>
  );
}
