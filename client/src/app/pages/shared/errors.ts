import { HttpErrorResponse } from '@angular/common/http';
import { ApiErrorBody } from '../../core/models';

// Turn any HTTP error into a single user-facing sentence.
// Backend sends either { message } or express-validator { errors: [{msg}] }.
export function apiError(err: unknown, fallback = 'Something went wrong'): string {
  if (err instanceof HttpErrorResponse) {
    const body = err.error as ApiErrorBody | string | undefined;
    if (typeof body === 'string') return body || fallback;
    if (body?.errors?.length) {
      return body.errors.map((e) => e.msg).join(' · ');
    }
    if (body?.message) return body.message;
    if (err.status === 0) return 'Cannot reach the server. Is the API running?';
  }
  return fallback;
}
