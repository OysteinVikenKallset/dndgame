import type { ValidationFieldError } from "../../application/use-cases/page-input-validation-error";

export type ApiSuccessResponse<T> = {
  status: number;
  body: {
    data: T;
  };
};

export type ApiErrorResponse = {
  status: number;
  body: {
    error: {
      code: string;
      message: string;
      fieldErrors?: ValidationFieldError[];
    };
  };
};

export function createApiSuccessResponse<T>(
  status: number,
  data: T,
): ApiSuccessResponse<T> {
  return {
    status,
    body: {
      data,
    },
  };
}

export function createApiErrorResponse(
  status: number,
  code: string,
  message: string,
  fieldErrors?: ValidationFieldError[],
): ApiErrorResponse {
  return {
    status,
    body: {
      error: {
        code,
        message,
        ...(fieldErrors && fieldErrors.length > 0 ? { fieldErrors } : {}),
      },
    },
  };
}
