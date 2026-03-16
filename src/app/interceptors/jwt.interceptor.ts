import { HttpInterceptorFn } from '@angular/common/http';

// Session-cookie auth: browser sends JSESSIONID automatically.
// We just ensure withCredentials=true so cookies cross-origin.
export const sessionInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req.clone({ withCredentials: true }));
};
