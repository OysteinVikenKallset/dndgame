import type {
  ChangeEvent,
  Dispatch,
  DragEvent,
  ReactElement,
  ReactNode,
  SetStateAction,
} from "react";
import { useEffect, useMemo, useState } from "react";
import { api, type MediaAssetDto } from "../../api-client";
import type { FieldErrors, PageFormValues } from "../common/types";
import { duplicatePageComponent } from "./page-component-duplicate";
import {
  movePageComponent,
  type DragLocation,
  type DropLocation,
} from "./page-component-dnd";
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
  sideActions?: ReactNode;
};

function componentTypeLabel(
  type: PageFormValues["components"][number]["componentType"],
): string {
  if (type === "richText") {
    return "Rich text";
  }

  if (type === "textImage") {
    return "Text and image";
  }

  if (type === "headline") {
    return "Headline";
  }

  return type.charAt(0).toUpperCase() + type.slice(1);
}

function defaultComponentByType(
  type: string,
  allowGrid = true,
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

  if (type === "button") {
    return {
      componentType: "button",
      props: {
        label: "",
        url: "",
        openInNewTab: false,
      },
    };
  }

  if (type === "headline") {
    return {
      componentType: "headline",
      props: {
        text: "",
        level: "h2",
      },
    };
  }

  if (type === "grid" && allowGrid) {
    return {
      componentType: "grid",
      props: {
        width: "100",
        contentAlign: "left",
        selfAlign: "left",
        components: [],
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
  sideActions,
}: PageEditorFieldsProps): ReactElement {
  const [mediaItems, setMediaItems] = useState<MediaAssetDto[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState("");
  const [dragSource, setDragSource] = useState<DragLocation | null>(null);
  const [activeDropTarget, setActiveDropTarget] = useState<string | null>(null);
  const [activeOverviewKey, setActiveOverviewKey] = useState<string | null>(
    null,
  );
  const isDragging = dragSource !== null;

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

  useEffect(() => {
    void loadMedia();
  }, []);

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

  function duplicateComponent(index: number): void {
    setValues((previous) => ({
      ...previous,
      components: duplicatePageComponent(previous.components, {
        container: "root",
        index,
      }),
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

  function addGridChild(parentIndex: number, type: string): void {
    const child = defaultComponentByType(type, false);

    if (!child) {
      return;
    }

    setValues((previous) => ({
      ...previous,
      components: previous.components.map((entry, current) => {
        if (current !== parentIndex || entry.componentType !== "grid") {
          return entry;
        }

        return {
          componentType: "grid",
          props: {
            ...entry.props,
            components: [...entry.props.components, child],
          },
        };
      }),
    }));
  }

  function setGridChild(
    parentIndex: number,
    childIndex: number,
    value: PageFormValues["components"][number],
  ): void {
    setValues((previous) => ({
      ...previous,
      components: previous.components.map((entry, current) => {
        if (current !== parentIndex || entry.componentType !== "grid") {
          return entry;
        }

        return {
          componentType: "grid",
          props: {
            ...entry.props,
            components: entry.props.components.map((child, nestedCurrent) =>
              nestedCurrent === childIndex ? value : child,
            ),
          },
        };
      }),
    }));
  }

  function removeGridChild(parentIndex: number, childIndex: number): void {
    setValues((previous) => ({
      ...previous,
      components: previous.components.map((entry, current) => {
        if (current !== parentIndex || entry.componentType !== "grid") {
          return entry;
        }

        return {
          componentType: "grid",
          props: {
            ...entry.props,
            components: entry.props.components.filter(
              (_, nestedCurrent) => nestedCurrent !== childIndex,
            ),
          },
        };
      }),
    }));
  }

  function duplicateGridChild(parentIndex: number, childIndex: number): void {
    setValues((previous) => ({
      ...previous,
      components: duplicatePageComponent(previous.components, {
        container: "grid",
        gridIndex: parentIndex,
        index: childIndex,
      }),
    }));
  }

  function moveGridChild(
    parentIndex: number,
    childIndex: number,
    direction: -1 | 1,
  ): void {
    setValues((previous) => ({
      ...previous,
      components: previous.components.map((entry, current) => {
        if (current !== parentIndex || entry.componentType !== "grid") {
          return entry;
        }

        const nextIndex = childIndex + direction;

        if (nextIndex < 0 || nextIndex >= entry.props.components.length) {
          return entry;
        }

        const nextChildren = [...entry.props.components];
        const currentChild = nextChildren[childIndex];
        nextChildren[childIndex] = nextChildren[nextIndex]!;
        nextChildren[nextIndex] = currentChild!;

        return {
          componentType: "grid",
          props: {
            ...entry.props,
            components: nextChildren,
          },
        };
      }),
    }));
  }

  function clearDragState(): void {
    setDragSource(null);
    setActiveDropTarget(null);
  }

  function beginDrag(
    source: DragLocation,
    event: DragEvent<HTMLElement>,
    requireHandle = true,
  ): void {
    if (disabled) {
      return;
    }

    if (requireHandle) {
      const target = event.target;

      if (
        !(target instanceof Element) ||
        !target.closest(".editor-drag-handle")
      ) {
        event.preventDefault();
        return;
      }
    }

    setDragSource(source);
    setActiveDropTarget(null);
    event.dataTransfer.setData("text/plain", "move");
    event.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(
    event: DragEvent<HTMLElement>,
    targetKey: string,
  ): void {
    if (disabled || !dragSource) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (activeDropTarget !== targetKey) {
      setActiveDropTarget(targetKey);
    }
  }

  function dropTo(
    event: DragEvent<HTMLElement>,
    destination: DropLocation,
  ): void {
    if (disabled || !dragSource) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    setValues((previous) => ({
      ...previous,
      components: movePageComponent(
        previous.components,
        dragSource,
        destination,
      ),
    }));

    clearDragState();
  }

  function getDropZoneStyle(
    targetKey: string,
  ): { boxShadow: string } | undefined {
    if (activeDropTarget !== targetKey) {
      return undefined;
    }

    return {
      boxShadow: "inset 0 2px 0 var(--primary)",
    };
  }

  function renderDuplicateButton(onClick: () => void): ReactElement {
    return (
      <button
        type="button"
        className="editor-duplicate-button"
        aria-label="Duplicate component"
        title="Duplicate component"
        onClick={(event) => {
          event.stopPropagation();
          onClick();
        }}
        disabled={disabled}
        draggable={false}
      >
        ⧉
      </button>
    );
  }

  function renderDragHandle(source: DragLocation): ReactElement {
    return (
      <button
        type="button"
        className="editor-drag-handle"
        aria-label="Drag component"
        title="Drag component"
        draggable={!disabled}
        onDragStart={(event) => beginDrag(source, event)}
        onDragEnd={clearDragState}
        disabled={disabled}
      >
        ↕
      </button>
    );
  }

  function renderCardToolbar(
    source: DragLocation,
    onDuplicate: () => void,
  ): ReactElement {
    return (
      <div className="editor-card-toolbar">
        {renderDragHandle(source)}
        {renderDuplicateButton(onDuplicate)}
      </div>
    );
  }

  function autoResizeTextarea(target: HTMLTextAreaElement): void {
    target.style.height = "auto";
    target.style.height = `${target.scrollHeight}px`;
  }

  function autoSizeOnInput(event: ChangeEvent<HTMLTextAreaElement>): void {
    autoResizeTextarea(event.currentTarget);
  }

  function componentElementId(location: DragLocation): string {
    if (location.container === "root") {
      return `component-root-${location.index}`;
    }

    return `component-grid-${location.gridIndex}-child-${location.index}`;
  }

  function overviewLocationKey(location: DragLocation): string {
    if (location.container === "root") {
      return `root:${location.index}`;
    }

    return `grid:${location.gridIndex}:${location.index}`;
  }

  function focusComponent(location: DragLocation): void {
    setActiveOverviewKey(overviewLocationKey(location));

    const element = document.getElementById(componentElementId(location));

    if (!element) {
      return;
    }

    element.scrollIntoView({ behavior: "smooth", block: "center" });

    if ("focus" in element) {
      (element as HTMLElement).focus({ preventScroll: true });
    }
  }

  return (
    <>
      <div className="editor-workspace-shell">
        <aside className="editor-outline-panel" aria-label="Component overview">
          <p className="editor-section-title">Component overview</p>
          <div className="ui-card ui-card--subtle">
            {values.components.length === 0 ? (
              <p className="ui-inline-message">No components yet.</p>
            ) : (
              <ul className="editor-outline-list">
                {values.components.map((component, index) => (
                  <li
                    key={`overview-${index}`}
                    className={`editor-outline-item ${
                      activeOverviewKey === `root:${index}`
                        ? "editor-outline-item--active"
                        : ""
                    }`}
                    onDragOver={(event) =>
                      handleDragOver(event, `overview:root:${index}`)
                    }
                    onDrop={(event) =>
                      dropTo(event, { container: "root", index })
                    }
                    style={getDropZoneStyle(`overview:root:${index}`)}
                  >
                    <div className="editor-outline-row">
                      <button
                        type="button"
                        className="editor-outline-link"
                        draggable={!disabled}
                        onDragStart={(event) =>
                          beginDrag({ container: "root", index }, event, false)
                        }
                        onDragEnd={clearDragState}
                        onClick={() =>
                          focusComponent({ container: "root", index })
                        }
                      >
                        {index + 1}.{" "}
                        {componentTypeLabel(component.componentType)}
                      </button>
                    </div>
                    {component.componentType === "grid" ? (
                      <ul>
                        {component.props.components.map((child, childIndex) => (
                          <li
                            key={`overview-${index}-${childIndex}`}
                            className={`editor-outline-item ${
                              activeOverviewKey ===
                              `grid:${index}:${childIndex}`
                                ? "editor-outline-item--active"
                                : ""
                            }`}
                            onDragOver={(event) =>
                              handleDragOver(
                                event,
                                `overview:grid:${index}:${childIndex}`,
                              )
                            }
                            onDrop={(event) =>
                              dropTo(event, {
                                container: "grid",
                                gridIndex: index,
                                index: childIndex,
                              })
                            }
                            style={getDropZoneStyle(
                              `overview:grid:${index}:${childIndex}`,
                            )}
                          >
                            <div className="editor-outline-row">
                              <button
                                type="button"
                                className="editor-outline-link"
                                draggable={!disabled}
                                onDragStart={(event) =>
                                  beginDrag(
                                    {
                                      container: "grid",
                                      gridIndex: index,
                                      index: childIndex,
                                    },
                                    event,
                                    false,
                                  )
                                }
                                onDragEnd={clearDragState}
                                onClick={() =>
                                  focusComponent({
                                    container: "grid",
                                    gridIndex: index,
                                    index: childIndex,
                                  })
                                }
                              >
                                {index + 1}.{childIndex + 1}{" "}
                                {componentTypeLabel(child.componentType)}
                              </button>
                            </div>
                          </li>
                        ))}
                        <li
                          className={`editor-drop-indicator editor-outline-drop-indicator ${
                            isDragging ? "editor-drop-indicator--visible" : ""
                          }`}
                          onDragOver={(event) =>
                            handleDragOver(event, `overview:grid:${index}:end`)
                          }
                          onDrop={(event) =>
                            dropTo(event, {
                              container: "grid",
                              gridIndex: index,
                              index: component.props.components.length,
                            })
                          }
                          style={getDropZoneStyle(`overview:grid:${index}:end`)}
                          aria-label="Drop in grid"
                        />
                      </ul>
                    ) : null}
                  </li>
                ))}
                <li
                  className={`editor-drop-indicator editor-outline-drop-indicator ${
                    isDragging ? "editor-drop-indicator--visible" : ""
                  }`}
                  onDragOver={(event) =>
                    handleDragOver(event, "overview:root:end")
                  }
                  onDrop={(event) =>
                    dropTo(event, {
                      container: "root",
                      index: values.components.length,
                    })
                  }
                  style={getDropZoneStyle("overview:root:end")}
                  aria-label="Drop at end"
                />
              </ul>
            )}
          </div>
        </aside>

        <section className="editor-content-panel">
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
                  <option value="headline">Headline</option>
                  <option value="button">Button</option>
                  <option value="grid">Grid</option>
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

              <div className="ui-stack editor-component-stack">
                {values.components.map((component, index) => {
                  if (component.componentType === "richText") {
                    return (
                      <div
                        key={`component-${index}`}
                        className="ui-card ui-card--subtle ui-stack"
                        id={`component-root-${index}`}
                        tabIndex={-1}
                        draggable={!disabled}
                        onDragStart={(event) =>
                          beginDrag({ container: "root", index }, event)
                        }
                        onDragEnd={clearDragState}
                        onDragOver={(event) =>
                          handleDragOver(event, `root:${index}`)
                        }
                        onDrop={(event) =>
                          dropTo(event, { container: "root", index })
                        }
                        style={getDropZoneStyle(`root:${index}`)}
                      >
                        {renderCardToolbar({ container: "root", index }, () =>
                          duplicateComponent(index),
                        )}
                        <p>
                          <strong>Rich text</strong>
                        </p>
                        <textarea
                          className="ui-textarea editor-auto-grow-textarea"
                          value={component.props.html}
                          onChange={(event) => {
                            autoSizeOnInput(event);
                            setComponent(index, {
                              componentType: "richText",
                              props: {
                                html: event.target.value,
                              },
                            });
                          }}
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
                        id={`component-root-${index}`}
                        tabIndex={-1}
                        draggable={!disabled}
                        onDragStart={(event) =>
                          beginDrag({ container: "root", index }, event)
                        }
                        onDragEnd={clearDragState}
                        onDragOver={(event) =>
                          handleDragOver(event, `root:${index}`)
                        }
                        onDrop={(event) =>
                          dropTo(event, { container: "root", index })
                        }
                        style={getDropZoneStyle(`root:${index}`)}
                      >
                        {renderCardToolbar({ container: "root", index }, () =>
                          duplicateComponent(index),
                        )}
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
                        id={`component-root-${index}`}
                        tabIndex={-1}
                        draggable={!disabled}
                        onDragStart={(event) =>
                          beginDrag({ container: "root", index }, event)
                        }
                        onDragEnd={clearDragState}
                        onDragOver={(event) =>
                          handleDragOver(event, `root:${index}`)
                        }
                        onDrop={(event) =>
                          dropTo(event, { container: "root", index })
                        }
                        style={getDropZoneStyle(`root:${index}`)}
                      >
                        {renderCardToolbar({ container: "root", index }, () =>
                          duplicateComponent(index),
                        )}
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

                  if (component.componentType === "headline") {
                    return (
                      <div
                        key={`component-${index}`}
                        className="ui-card ui-card--subtle ui-stack"
                        id={`component-root-${index}`}
                        tabIndex={-1}
                        draggable={!disabled}
                        onDragStart={(event) =>
                          beginDrag({ container: "root", index }, event)
                        }
                        onDragEnd={clearDragState}
                        onDragOver={(event) =>
                          handleDragOver(event, `root:${index}`)
                        }
                        onDrop={(event) =>
                          dropTo(event, { container: "root", index })
                        }
                        style={getDropZoneStyle(`root:${index}`)}
                      >
                        {renderCardToolbar({ container: "root", index }, () =>
                          duplicateComponent(index),
                        )}
                        <p>
                          <strong>Headline</strong>
                        </p>
                        <input
                          className="ui-input"
                          value={component.props.text}
                          onChange={(event) =>
                            setComponent(index, {
                              componentType: "headline",
                              props: {
                                ...component.props,
                                text: event.target.value,
                              },
                            })
                          }
                          disabled={disabled}
                          placeholder="Headline text"
                        />
                        <select
                          className="ui-select"
                          value={component.props.level}
                          onChange={(event) =>
                            setComponent(index, {
                              componentType: "headline",
                              props: {
                                ...component.props,
                                level:
                                  event.target.value === "h1" ||
                                  event.target.value === "h2" ||
                                  event.target.value === "h3" ||
                                  event.target.value === "h4" ||
                                  event.target.value === "h5" ||
                                  event.target.value === "h6"
                                    ? event.target.value
                                    : "h2",
                              },
                            })
                          }
                          disabled={disabled}
                        >
                          <option value="h1">H1</option>
                          <option value="h2">H2</option>
                          <option value="h3">H3</option>
                          <option value="h4">H4</option>
                          <option value="h5">H5</option>
                          <option value="h6">H6</option>
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
                  }

                  if (component.componentType === "button") {
                    return (
                      <div
                        key={`component-${index}`}
                        className="ui-card ui-card--subtle ui-stack"
                        id={`component-root-${index}`}
                        tabIndex={-1}
                        draggable={!disabled}
                        onDragStart={(event) =>
                          beginDrag({ container: "root", index }, event)
                        }
                        onDragEnd={clearDragState}
                        onDragOver={(event) =>
                          handleDragOver(event, `root:${index}`)
                        }
                        onDrop={(event) =>
                          dropTo(event, { container: "root", index })
                        }
                        style={getDropZoneStyle(`root:${index}`)}
                      >
                        {renderCardToolbar({ container: "root", index }, () =>
                          duplicateComponent(index),
                        )}
                        <p>
                          <strong>Button</strong>
                        </p>
                        <input
                          className="ui-input"
                          value={component.props.label}
                          onChange={(event) =>
                            setComponent(index, {
                              componentType: "button",
                              props: {
                                ...component.props,
                                label: event.target.value,
                              },
                            })
                          }
                          disabled={disabled}
                          placeholder="Button text"
                        />
                        <input
                          className="ui-input"
                          value={component.props.url}
                          onChange={(event) =>
                            setComponent(index, {
                              componentType: "button",
                              props: {
                                ...component.props,
                                url: event.target.value,
                              },
                            })
                          }
                          disabled={disabled}
                          placeholder="URL"
                        />
                        <label className="ui-checkbox">
                          <input
                            type="checkbox"
                            checked={component.props.openInNewTab}
                            onChange={(event) =>
                              setComponent(index, {
                                componentType: "button",
                                props: {
                                  ...component.props,
                                  openInNewTab: event.target.checked,
                                },
                              })
                            }
                            disabled={disabled}
                          />
                          <span>Open in new tab</span>
                        </label>
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

                  if (component.componentType === "grid") {
                    return (
                      <div
                        key={`component-${index}`}
                        className="ui-card ui-card--subtle ui-stack"
                        id={`component-root-${index}`}
                        tabIndex={-1}
                        draggable={!disabled}
                        onDragStart={(event) =>
                          beginDrag({ container: "root", index }, event)
                        }
                        onDragEnd={clearDragState}
                        onDragOver={(event) =>
                          handleDragOver(event, `root:${index}`)
                        }
                        onDrop={(event) =>
                          dropTo(event, { container: "root", index })
                        }
                        style={getDropZoneStyle(`root:${index}`)}
                      >
                        {renderCardToolbar({ container: "root", index }, () =>
                          duplicateComponent(index),
                        )}
                        <p>
                          <strong>Grid</strong>
                        </p>

                        <select
                          className="ui-select"
                          value={component.props.width}
                          onChange={(event) =>
                            setComponent(index, {
                              componentType: "grid",
                              props: {
                                ...component.props,
                                width:
                                  event.target.value === "100" ||
                                  event.target.value === "50" ||
                                  event.target.value === "33" ||
                                  event.target.value === "25"
                                    ? event.target.value
                                    : "100",
                              },
                            })
                          }
                          disabled={disabled}
                        >
                          <option value="100">Width 100%</option>
                          <option value="50">Width 50%</option>
                          <option value="33">Width 33%</option>
                          <option value="25">Width 25%</option>
                        </select>

                        <select
                          className="ui-select"
                          value={component.props.contentAlign}
                          onChange={(event) =>
                            setComponent(index, {
                              componentType: "grid",
                              props: {
                                ...component.props,
                                contentAlign:
                                  event.target.value === "left" ||
                                  event.target.value === "center" ||
                                  event.target.value === "right"
                                    ? event.target.value
                                    : "left",
                              },
                            })
                          }
                          disabled={disabled}
                        >
                          <option value="left">Content left</option>
                          <option value="center">Content center</option>
                          <option value="right">Content right</option>
                        </select>

                        <select
                          className="ui-select"
                          value={component.props.selfAlign}
                          onChange={(event) =>
                            setComponent(index, {
                              componentType: "grid",
                              props: {
                                ...component.props,
                                selfAlign:
                                  event.target.value === "left" ||
                                  event.target.value === "center" ||
                                  event.target.value === "right"
                                    ? event.target.value
                                    : "left",
                              },
                            })
                          }
                          disabled={disabled}
                        >
                          <option value="left">Place left</option>
                          <option value="center">Place center</option>
                          <option value="right">Place right</option>
                        </select>

                        <div className="ui-card ui-card--subtle ui-stack">
                          <p>
                            <strong>Grid children</strong>
                          </p>

                          <select
                            className="ui-select"
                            disabled={disabled}
                            onChange={(event) => {
                              if (!event.target.value) {
                                return;
                              }

                              addGridChild(index, event.target.value);
                              event.target.value = "";
                            }}
                            defaultValue=""
                          >
                            <option value="" disabled>
                              Add child component...
                            </option>
                            <option value="richText">Rich text</option>
                            <option value="image">Image</option>
                            <option value="textImage">Text and image</option>
                            <option value="quote">Quote</option>
                            <option value="headline">Headline</option>
                            <option value="button">Button</option>
                          </select>

                          {component.props.components.length === 0 ? (
                            <div
                              className={`editor-drop-indicator editor-content-drop-indicator editor-drop-indicator--empty ${
                                isDragging
                                  ? "editor-drop-indicator--visible"
                                  : ""
                              }`}
                              onDragOver={(event) =>
                                handleDragOver(event, `grid:${index}:end`)
                              }
                              onDrop={(event) =>
                                dropTo(event, {
                                  container: "grid",
                                  gridIndex: index,
                                  index: 0,
                                })
                              }
                              style={getDropZoneStyle(`grid:${index}:end`)}
                              aria-label="Drop in empty grid"
                            />
                          ) : null}

                          {component.props.components.length === 0 ? (
                            <p className="ui-inline-message">
                              No child components yet.
                            </p>
                          ) : null}

                          {component.props.components.map(
                            (child, childIndex) => {
                              if (child.componentType === "richText") {
                                return (
                                  <div
                                    key={`grid-${index}-child-${childIndex}`}
                                    className="ui-card ui-card--subtle ui-stack"
                                    id={`component-grid-${index}-child-${childIndex}`}
                                    tabIndex={-1}
                                    draggable={!disabled}
                                    onDragStart={(event) =>
                                      beginDrag(
                                        {
                                          container: "grid",
                                          gridIndex: index,
                                          index: childIndex,
                                        },
                                        event,
                                      )
                                    }
                                    onDragEnd={clearDragState}
                                    onDragOver={(event) =>
                                      handleDragOver(
                                        event,
                                        `grid:${index}:${childIndex}`,
                                      )
                                    }
                                    onDrop={(event) =>
                                      dropTo(event, {
                                        container: "grid",
                                        gridIndex: index,
                                        index: childIndex,
                                      })
                                    }
                                    style={getDropZoneStyle(
                                      `grid:${index}:${childIndex}`,
                                    )}
                                  >
                                    {renderCardToolbar(
                                      {
                                        container: "grid",
                                        gridIndex: index,
                                        index: childIndex,
                                      },
                                      () =>
                                        duplicateGridChild(index, childIndex),
                                    )}
                                    <p>
                                      <strong>Child: Rich text</strong>
                                    </p>
                                    <textarea
                                      className="ui-textarea editor-auto-grow-textarea"
                                      value={child.props.html}
                                      onChange={(event) => {
                                        autoSizeOnInput(event);
                                        setGridChild(index, childIndex, {
                                          componentType: "richText",
                                          props: { html: event.target.value },
                                        });
                                      }}
                                      disabled={disabled}
                                    />
                                    <div className="editor-form-actions">
                                      <button
                                        type="button"
                                        className="ui-button ui-button--ghost"
                                        onClick={() =>
                                          moveGridChild(index, childIndex, -1)
                                        }
                                        disabled={disabled || childIndex === 0}
                                      >
                                        Up
                                      </button>
                                      <button
                                        type="button"
                                        className="ui-button ui-button--ghost"
                                        onClick={() =>
                                          moveGridChild(index, childIndex, 1)
                                        }
                                        disabled={
                                          disabled ||
                                          childIndex ===
                                            component.props.components.length -
                                              1
                                        }
                                      >
                                        Down
                                      </button>
                                      <button
                                        type="button"
                                        className="ui-button ui-button--danger"
                                        onClick={() =>
                                          removeGridChild(index, childIndex)
                                        }
                                        disabled={disabled}
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  </div>
                                );
                              }

                              if (child.componentType === "headline") {
                                return (
                                  <div
                                    key={`grid-${index}-child-${childIndex}`}
                                    className="ui-card ui-card--subtle ui-stack"
                                    id={`component-grid-${index}-child-${childIndex}`}
                                    tabIndex={-1}
                                    draggable={!disabled}
                                    onDragStart={(event) =>
                                      beginDrag(
                                        {
                                          container: "grid",
                                          gridIndex: index,
                                          index: childIndex,
                                        },
                                        event,
                                      )
                                    }
                                    onDragEnd={clearDragState}
                                    onDragOver={(event) =>
                                      handleDragOver(
                                        event,
                                        `grid:${index}:${childIndex}`,
                                      )
                                    }
                                    onDrop={(event) =>
                                      dropTo(event, {
                                        container: "grid",
                                        gridIndex: index,
                                        index: childIndex,
                                      })
                                    }
                                    style={getDropZoneStyle(
                                      `grid:${index}:${childIndex}`,
                                    )}
                                  >
                                    {renderCardToolbar(
                                      {
                                        container: "grid",
                                        gridIndex: index,
                                        index: childIndex,
                                      },
                                      () =>
                                        duplicateGridChild(index, childIndex),
                                    )}
                                    <p>
                                      <strong>Child: Headline</strong>
                                    </p>
                                    <input
                                      className="ui-input"
                                      value={child.props.text}
                                      onChange={(event) =>
                                        setGridChild(index, childIndex, {
                                          componentType: "headline",
                                          props: {
                                            ...child.props,
                                            text: event.target.value,
                                          },
                                        })
                                      }
                                      disabled={disabled}
                                      placeholder="Headline text"
                                    />
                                    <select
                                      className="ui-select"
                                      value={child.props.level}
                                      onChange={(event) =>
                                        setGridChild(index, childIndex, {
                                          componentType: "headline",
                                          props: {
                                            ...child.props,
                                            level:
                                              event.target.value === "h1" ||
                                              event.target.value === "h2" ||
                                              event.target.value === "h3" ||
                                              event.target.value === "h4" ||
                                              event.target.value === "h5" ||
                                              event.target.value === "h6"
                                                ? event.target.value
                                                : "h2",
                                          },
                                        })
                                      }
                                      disabled={disabled}
                                    >
                                      <option value="h1">H1</option>
                                      <option value="h2">H2</option>
                                      <option value="h3">H3</option>
                                      <option value="h4">H4</option>
                                      <option value="h5">H5</option>
                                      <option value="h6">H6</option>
                                    </select>
                                    <div className="editor-form-actions">
                                      <button
                                        type="button"
                                        className="ui-button ui-button--ghost"
                                        onClick={() =>
                                          moveGridChild(index, childIndex, -1)
                                        }
                                        disabled={disabled || childIndex === 0}
                                      >
                                        Up
                                      </button>
                                      <button
                                        type="button"
                                        className="ui-button ui-button--ghost"
                                        onClick={() =>
                                          moveGridChild(index, childIndex, 1)
                                        }
                                        disabled={
                                          disabled ||
                                          childIndex ===
                                            component.props.components.length -
                                              1
                                        }
                                      >
                                        Down
                                      </button>
                                      <button
                                        type="button"
                                        className="ui-button ui-button--danger"
                                        onClick={() =>
                                          removeGridChild(index, childIndex)
                                        }
                                        disabled={disabled}
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  </div>
                                );
                              }

                              if (child.componentType === "button") {
                                return (
                                  <div
                                    key={`grid-${index}-child-${childIndex}`}
                                    className="ui-card ui-card--subtle ui-stack"
                                    id={`component-grid-${index}-child-${childIndex}`}
                                    tabIndex={-1}
                                    draggable={!disabled}
                                    onDragStart={(event) =>
                                      beginDrag(
                                        {
                                          container: "grid",
                                          gridIndex: index,
                                          index: childIndex,
                                        },
                                        event,
                                      )
                                    }
                                    onDragEnd={clearDragState}
                                    onDragOver={(event) =>
                                      handleDragOver(
                                        event,
                                        `grid:${index}:${childIndex}`,
                                      )
                                    }
                                    onDrop={(event) =>
                                      dropTo(event, {
                                        container: "grid",
                                        gridIndex: index,
                                        index: childIndex,
                                      })
                                    }
                                    style={getDropZoneStyle(
                                      `grid:${index}:${childIndex}`,
                                    )}
                                  >
                                    {renderCardToolbar(
                                      {
                                        container: "grid",
                                        gridIndex: index,
                                        index: childIndex,
                                      },
                                      () =>
                                        duplicateGridChild(index, childIndex),
                                    )}
                                    <p>
                                      <strong>Child: Button</strong>
                                    </p>
                                    <input
                                      className="ui-input"
                                      value={child.props.label}
                                      onChange={(event) =>
                                        setGridChild(index, childIndex, {
                                          componentType: "button",
                                          props: {
                                            ...child.props,
                                            label: event.target.value,
                                          },
                                        })
                                      }
                                      disabled={disabled}
                                      placeholder="Button text"
                                    />
                                    <input
                                      className="ui-input"
                                      value={child.props.url}
                                      onChange={(event) =>
                                        setGridChild(index, childIndex, {
                                          componentType: "button",
                                          props: {
                                            ...child.props,
                                            url: event.target.value,
                                          },
                                        })
                                      }
                                      disabled={disabled}
                                      placeholder="URL"
                                    />
                                    <label className="ui-checkbox">
                                      <input
                                        type="checkbox"
                                        checked={child.props.openInNewTab}
                                        onChange={(event) =>
                                          setGridChild(index, childIndex, {
                                            componentType: "button",
                                            props: {
                                              ...child.props,
                                              openInNewTab:
                                                event.target.checked,
                                            },
                                          })
                                        }
                                        disabled={disabled}
                                      />
                                      <span>Open in new tab</span>
                                    </label>
                                    <div className="editor-form-actions">
                                      <button
                                        type="button"
                                        className="ui-button ui-button--ghost"
                                        onClick={() =>
                                          moveGridChild(index, childIndex, -1)
                                        }
                                        disabled={disabled || childIndex === 0}
                                      >
                                        Up
                                      </button>
                                      <button
                                        type="button"
                                        className="ui-button ui-button--ghost"
                                        onClick={() =>
                                          moveGridChild(index, childIndex, 1)
                                        }
                                        disabled={
                                          disabled ||
                                          childIndex ===
                                            component.props.components.length -
                                              1
                                        }
                                      >
                                        Down
                                      </button>
                                      <button
                                        type="button"
                                        className="ui-button ui-button--danger"
                                        onClick={() =>
                                          removeGridChild(index, childIndex)
                                        }
                                        disabled={disabled}
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  </div>
                                );
                              }

                              if (child.componentType === "quote") {
                                return (
                                  <div
                                    key={`grid-${index}-child-${childIndex}`}
                                    className="ui-card ui-card--subtle ui-stack"
                                    id={`component-grid-${index}-child-${childIndex}`}
                                    tabIndex={-1}
                                    draggable={!disabled}
                                    onDragStart={(event) =>
                                      beginDrag(
                                        {
                                          container: "grid",
                                          gridIndex: index,
                                          index: childIndex,
                                        },
                                        event,
                                      )
                                    }
                                    onDragEnd={clearDragState}
                                    onDragOver={(event) =>
                                      handleDragOver(
                                        event,
                                        `grid:${index}:${childIndex}`,
                                      )
                                    }
                                    onDrop={(event) =>
                                      dropTo(event, {
                                        container: "grid",
                                        gridIndex: index,
                                        index: childIndex,
                                      })
                                    }
                                    style={getDropZoneStyle(
                                      `grid:${index}:${childIndex}`,
                                    )}
                                  >
                                    {renderCardToolbar(
                                      {
                                        container: "grid",
                                        gridIndex: index,
                                        index: childIndex,
                                      },
                                      () =>
                                        duplicateGridChild(index, childIndex),
                                    )}
                                    <p>
                                      <strong>Child: Quote</strong>
                                    </p>
                                    <input
                                      className="ui-input"
                                      value={child.props.quote}
                                      onChange={(event) =>
                                        setGridChild(index, childIndex, {
                                          componentType: "quote",
                                          props: {
                                            ...child.props,
                                            quote: event.target.value,
                                          },
                                        })
                                      }
                                      disabled={disabled}
                                      placeholder="Quote"
                                    />
                                    <input
                                      className="ui-input"
                                      value={child.props.author ?? ""}
                                      onChange={(event) =>
                                        setGridChild(index, childIndex, {
                                          componentType: "quote",
                                          props: {
                                            ...child.props,
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
                                        onClick={() =>
                                          moveGridChild(index, childIndex, -1)
                                        }
                                        disabled={disabled || childIndex === 0}
                                      >
                                        Up
                                      </button>
                                      <button
                                        type="button"
                                        className="ui-button ui-button--ghost"
                                        onClick={() =>
                                          moveGridChild(index, childIndex, 1)
                                        }
                                        disabled={
                                          disabled ||
                                          childIndex ===
                                            component.props.components.length -
                                              1
                                        }
                                      >
                                        Down
                                      </button>
                                      <button
                                        type="button"
                                        className="ui-button ui-button--danger"
                                        onClick={() =>
                                          removeGridChild(index, childIndex)
                                        }
                                        disabled={disabled}
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  </div>
                                );
                              }

                              if (child.componentType === "image") {
                                return (
                                  <div
                                    key={`grid-${index}-child-${childIndex}`}
                                    className="ui-card ui-card--subtle ui-stack"
                                    id={`component-grid-${index}-child-${childIndex}`}
                                    tabIndex={-1}
                                    draggable={!disabled}
                                    onDragStart={(event) =>
                                      beginDrag(
                                        {
                                          container: "grid",
                                          gridIndex: index,
                                          index: childIndex,
                                        },
                                        event,
                                      )
                                    }
                                    onDragEnd={clearDragState}
                                    onDragOver={(event) =>
                                      handleDragOver(
                                        event,
                                        `grid:${index}:${childIndex}`,
                                      )
                                    }
                                    onDrop={(event) =>
                                      dropTo(event, {
                                        container: "grid",
                                        gridIndex: index,
                                        index: childIndex,
                                      })
                                    }
                                    style={getDropZoneStyle(
                                      `grid:${index}:${childIndex}`,
                                    )}
                                  >
                                    {renderCardToolbar(
                                      {
                                        container: "grid",
                                        gridIndex: index,
                                        index: childIndex,
                                      },
                                      () =>
                                        duplicateGridChild(index, childIndex),
                                    )}
                                    <p>
                                      <strong>Child: Image</strong>
                                    </p>
                                    <select
                                      className="ui-select"
                                      value={child.props.mediaId}
                                      onChange={(event) => {
                                        const asset = mediaById.get(
                                          event.target.value,
                                        );
                                        setGridChild(index, childIndex, {
                                          componentType: "image",
                                          props: {
                                            ...child.props,
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
                                      value={child.props.alt}
                                      onChange={(event) =>
                                        setGridChild(index, childIndex, {
                                          componentType: "image",
                                          props: {
                                            ...child.props,
                                            alt: event.target.value,
                                          },
                                        })
                                      }
                                      disabled={disabled}
                                      placeholder="Alt text"
                                    />
                                    <input
                                      className="ui-input"
                                      value={child.props.caption ?? ""}
                                      onChange={(event) =>
                                        setGridChild(index, childIndex, {
                                          componentType: "image",
                                          props: {
                                            ...child.props,
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
                                        onClick={() =>
                                          moveGridChild(index, childIndex, -1)
                                        }
                                        disabled={disabled || childIndex === 0}
                                      >
                                        Up
                                      </button>
                                      <button
                                        type="button"
                                        className="ui-button ui-button--ghost"
                                        onClick={() =>
                                          moveGridChild(index, childIndex, 1)
                                        }
                                        disabled={
                                          disabled ||
                                          childIndex ===
                                            component.props.components.length -
                                              1
                                        }
                                      >
                                        Down
                                      </button>
                                      <button
                                        type="button"
                                        className="ui-button ui-button--danger"
                                        onClick={() =>
                                          removeGridChild(index, childIndex)
                                        }
                                        disabled={disabled}
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  </div>
                                );
                              }

                              if (child.componentType === "grid") {
                                return (
                                  <div
                                    key={`grid-${index}-child-${childIndex}`}
                                    className="ui-card ui-card--subtle ui-stack"
                                    id={`component-grid-${index}-child-${childIndex}`}
                                    tabIndex={-1}
                                    draggable={!disabled}
                                    onDragStart={(event) =>
                                      beginDrag(
                                        {
                                          container: "grid",
                                          gridIndex: index,
                                          index: childIndex,
                                        },
                                        event,
                                      )
                                    }
                                    onDragEnd={clearDragState}
                                  >
                                    {renderCardToolbar(
                                      {
                                        container: "grid",
                                        gridIndex: index,
                                        index: childIndex,
                                      },
                                      () =>
                                        duplicateGridChild(index, childIndex),
                                    )}
                                    <p>
                                      <strong>Child: Grid</strong>
                                    </p>
                                    <p className="ui-inline-message ui-inline-message--error">
                                      Nested grid is not supported.
                                    </p>
                                    <div className="editor-form-actions">
                                      <button
                                        type="button"
                                        className="ui-button ui-button--danger"
                                        onClick={() =>
                                          removeGridChild(index, childIndex)
                                        }
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
                                  key={`grid-${index}-child-${childIndex}`}
                                  className="ui-card ui-card--subtle ui-stack editor-component-card editor-component-card--grid"
                                  data-component-type="grid"
                                  id={`component-grid-${index}-child-${childIndex}`}
                                  tabIndex={-1}
                                  draggable={!disabled}
                                  onDragStart={(event) =>
                                    beginDrag(
                                      {
                                        container: "grid",
                                        gridIndex: index,
                                        index: childIndex,
                                      },
                                      event,
                                    )
                                  }
                                  onDragEnd={clearDragState}
                                  onDragOver={(event) =>
                                    handleDragOver(
                                      event,
                                      `grid:${index}:${childIndex}`,
                                    )
                                  }
                                  onDrop={(event) =>
                                    dropTo(event, {
                                      container: "grid",
                                      gridIndex: index,
                                      index: childIndex,
                                    })
                                  }
                                  style={getDropZoneStyle(
                                    `grid:${index}:${childIndex}`,
                                  )}
                                >
                                  {renderCardToolbar(
                                    {
                                      container: "grid",
                                      gridIndex: index,
                                      index: childIndex,
                                    },
                                    () => duplicateGridChild(index, childIndex),
                                  )}
                                  <p>
                                    <strong>Child: Text and image</strong>
                                  </p>
                                  <input
                                    className="ui-input"
                                    value={child.props.title ?? ""}
                                    onChange={(event) =>
                                      setGridChild(index, childIndex, {
                                        componentType: "textImage",
                                        props: {
                                          ...child.props,
                                          title: event.target.value,
                                        },
                                      })
                                    }
                                    disabled={disabled}
                                    placeholder="Title (optional)"
                                  />
                                  <textarea
                                    className="ui-textarea editor-auto-grow-textarea"
                                    value={child.props.text}
                                    onChange={(event) => {
                                      autoSizeOnInput(event);
                                      setGridChild(index, childIndex, {
                                        componentType: "textImage",
                                        props: {
                                          ...child.props,
                                          text: event.target.value,
                                        },
                                      });
                                    }}
                                    disabled={disabled}
                                  />
                                  <select
                                    className="ui-select"
                                    value={child.props.mediaId}
                                    onChange={(event) => {
                                      const asset = mediaById.get(
                                        event.target.value,
                                      );
                                      setGridChild(index, childIndex, {
                                        componentType: "textImage",
                                        props: {
                                          ...child.props,
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
                                    value={child.props.alt}
                                    onChange={(event) =>
                                      setGridChild(index, childIndex, {
                                        componentType: "textImage",
                                        props: {
                                          ...child.props,
                                          alt: event.target.value,
                                        },
                                      })
                                    }
                                    disabled={disabled}
                                    placeholder="Alt text"
                                  />
                                  <select
                                    className="ui-select"
                                    value={child.props.layout}
                                    onChange={(event) =>
                                      setGridChild(index, childIndex, {
                                        componentType: "textImage",
                                        props: {
                                          ...child.props,
                                          layout:
                                            event.target.value === "imageRight"
                                              ? "imageRight"
                                              : "imageLeft",
                                        },
                                      })
                                    }
                                    disabled={disabled}
                                  >
                                    <option value="imageLeft">
                                      Image left
                                    </option>
                                    <option value="imageRight">
                                      Image right
                                    </option>
                                  </select>
                                  <div className="editor-form-actions">
                                    <button
                                      type="button"
                                      className="ui-button ui-button--ghost"
                                      onClick={() =>
                                        moveGridChild(index, childIndex, -1)
                                      }
                                      disabled={disabled || childIndex === 0}
                                    >
                                      Up
                                    </button>
                                    <button
                                      type="button"
                                      className="ui-button ui-button--ghost"
                                      onClick={() =>
                                        moveGridChild(index, childIndex, 1)
                                      }
                                      disabled={
                                        disabled ||
                                        childIndex ===
                                          component.props.components.length - 1
                                      }
                                    >
                                      Down
                                    </button>
                                    <button
                                      type="button"
                                      className="ui-button ui-button--danger"
                                      onClick={() =>
                                        removeGridChild(index, childIndex)
                                      }
                                      disabled={disabled}
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              );
                            },
                          )}
                        </div>

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
                      id={`component-root-${index}`}
                      tabIndex={-1}
                      draggable={!disabled}
                      onDragStart={(event) =>
                        beginDrag({ container: "root", index }, event)
                      }
                      onDragEnd={clearDragState}
                      onDragOver={(event) =>
                        handleDragOver(event, `root:${index}`)
                      }
                      onDrop={(event) =>
                        dropTo(event, { container: "root", index })
                      }
                      style={getDropZoneStyle(`root:${index}`)}
                    >
                      {renderCardToolbar({ container: "root", index }, () =>
                        duplicateComponent(index),
                      )}
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
                        className="ui-textarea editor-auto-grow-textarea"
                        value={component.props.text}
                        onChange={(event) => {
                          autoSizeOnInput(event);
                          setComponent(index, {
                            componentType: "textImage",
                            props: {
                              ...component.props,
                              text: event.target.value,
                            },
                          });
                        }}
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

                {values.components.length === 0 ? (
                  <div
                    className={`editor-drop-indicator editor-content-drop-indicator editor-drop-indicator--empty ${
                      isDragging ? "editor-drop-indicator--visible" : ""
                    }`}
                    onDragOver={(event) => handleDragOver(event, "root:end")}
                    onDrop={(event) =>
                      dropTo(event, {
                        container: "root",
                        index: 0,
                      })
                    }
                    style={getDropZoneStyle("root:end")}
                    aria-label="Drop at root"
                  />
                ) : (
                  <div
                    className={`editor-drop-indicator editor-content-drop-indicator ${
                      isDragging ? "editor-drop-indicator--visible" : ""
                    }`}
                    onDragOver={(event) => handleDragOver(event, "root:end")}
                    onDrop={(event) =>
                      dropTo(event, {
                        container: "root",
                        index: values.components.length,
                      })
                    }
                    style={getDropZoneStyle("root:end")}
                    aria-label="Drop at end"
                  />
                )}
              </div>
            </div>
          </FormField>
        </section>

        <aside className="editor-settings-panel" aria-label="Page settings">
          {sideActions ? (
            <div className="editor-sidebar" aria-label="Page actions">
              {sideActions}
            </div>
          ) : null}

          <details className="editor-settings-accordion">
            <summary className="editor-settings-summary">Page settings</summary>

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
                label="Page title"
                htmlFor="showTitle"
                hint="Show page title heading on website"
              >
                <label className="ui-checkbox" htmlFor="showTitle">
                  <input
                    id="showTitle"
                    type="checkbox"
                    checked={values.showTitle}
                    onChange={(event) =>
                      setValues((previous) => ({
                        ...previous,
                        showTitle: event.target.checked,
                      }))
                    }
                    disabled={disabled}
                  />
                  Show page title on website
                </label>
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

              <FormField
                label="Locale"
                htmlFor="locale"
                hint="MVP locale is fixed"
              >
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
            </div>

            {status ? (
              <FormField label="Status" htmlFor="status">
                <TextInput id="status" value={status} readOnly disabled />
              </FormField>
            ) : null}

            {version !== undefined ? (
              <FormField label="Version" htmlFor="version">
                <TextInput
                  id="version"
                  value={String(version)}
                  readOnly
                  disabled
                />
              </FormField>
            ) : null}
          </details>
        </aside>
      </div>
    </>
  );
}
