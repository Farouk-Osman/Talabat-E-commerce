import { HttpInterceptorFn } from '@angular/common/http';

const TOKEN_KEY = 'talabat_token';

// Attach the Bearer token to every outgoing API request when present.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }
  return next(req);
};
