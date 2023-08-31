import { Injectable } from "@angular/core";
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
} from "@angular/common/http";

import { Observable } from "rxjs";
import { AuthService } from "./auth.service";

@Injectable({
  providedIn: "root",
})
export class AuthInterceptorService implements HttpInterceptor {
  
  constructor(public auth: AuthService) {} 
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (this.auth.tokenIsNotEmpty()) {
      const clonedRequest = req.clone({
        headers: req.headers.set('Authorization', 'Bearer ' + this.auth.userValue()!.token),
      });
      return next.handle(clonedRequest);
    } else {
      return next.handle(req);
    }
  }
}
