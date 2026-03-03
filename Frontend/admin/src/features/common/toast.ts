import type { Dispatch, SetStateAction } from "react";
import type { Toast } from "./types";

export function setToastError(
  setToast: Dispatch<SetStateAction<Toast | null>>,
  message: string,
): void {
  setToast({ type: "error", message });
}
