export type ValidationFieldError = {
  path: string;
  code: string;
  message: string;
};

export class PageInputValidationError extends Error {
  readonly fieldErrors: ValidationFieldError[];

  constructor(message: string, fieldErrors: ValidationFieldError[]) {
    super(message);
    this.name = "PageInputValidationError";
    this.fieldErrors = fieldErrors;
  }
}
