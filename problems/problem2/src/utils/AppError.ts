/**
 * An error carrying an HTTP status code, so services can signal
 * "not found" / "bad request" etc. and the central error handler
 * turns it into the right response.
 */
export class AppError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'AppError';
  }
}
