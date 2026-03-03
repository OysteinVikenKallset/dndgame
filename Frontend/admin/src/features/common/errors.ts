import type { ApiError } from "../../api-client";
import type { FieldErrors } from "./types";

export function mapErrorToMessage(error: ApiError | null | undefined): string {
  if (!error) {
    return "Something went wrong.";
  }

  if (error.status === 400 && error.fieldErrors.length > 0) {
    const firstMessage = error.fieldErrors.find(
      (entry) => typeof entry.message === "string" && entry.message.length > 0,
    )?.message;

    if (firstMessage) {
      return firstMessage;
    }
  }

  if (error.status === 401) {
    return "Session expired. Please log in again.";
  }

  if (error.status === 403) {
    return "Access denied.";
  }

  if (error.status === 404) {
    return "Not found.";
  }

  if (error.status === 409 && error.code === "CONFLICT_VERSION") {
    return "Somebody changed this page. Reload latest.";
  }

  if (error.status === 409 && error.code === "EMAIL_ALREADY_EXISTS") {
    return "Email is already in use.";
  }

  if (error.status === 429) {
    return "Too many attempts, try again soon.";
  }

  return error.message ?? "Something went wrong.";
}

export function extractFieldErrors(
  error: ApiError | null | undefined,
): FieldErrors {
  const entries = Array.isArray(error?.fieldErrors) ? error.fieldErrors : [];
  const byPath: FieldErrors = {};

  for (const entry of entries) {
    if (
      entry &&
      typeof entry.path === "string" &&
      typeof entry.message === "string"
    ) {
      byPath[entry.path] = entry.message;

      if (entry.path.startsWith("components[")) {
        byPath.components = entry.message;
      }
    }
  }

  return byPath;
}
