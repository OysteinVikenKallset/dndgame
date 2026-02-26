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
): ApiErrorResponse {
  return {
    status,
    body: {
      error: {
        code,
        message,
      },
    },
  };
}
