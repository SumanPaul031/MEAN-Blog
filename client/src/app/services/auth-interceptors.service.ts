import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Observable, throwError, empty, Subject } from 'rxjs';
import { catchError, tap, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthInterceptorsService implements HttpInterceptor {

  constructor(private authService: AuthService) { }

  intercept(req: HttpRequest<any>, next: HttpHandler){
    req = this.addAuthHeader(req);

    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        console.log(error);

        if(error.status === 401){
          //we are unauthorized
          //refresh the access token and if that fails, logout
          this.authService.logout();
          return empty();
        }
        return throwError(error);
      })
    );
  }

  addAuthHeader(req: HttpRequest<any>){
    //get the access token
    const token = this.authService.getAccessToken();

    if(token){
      //append the access token to the request header
      return req.clone({
        setHeaders: {
          'x-access-token': token
        }
      })
    }
    return req;
  }
}
