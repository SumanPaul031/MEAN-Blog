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
  
  refreshingAccessToken: boolean;

  accessTokenRefreshed: Subject<any> = new Subject(); 

  intercept(req: HttpRequest<any>, next: HttpHandler){
    req = this.addAuthHeader(req);

    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        console.log(error);

        if(error.status === 401){
          //we are unauthorized
          //refresh the access token and if that fails, logout
          return this.refreshAccessToken().pipe(
            switchMap(() => {
              req = this.addAuthHeader(req);
              return next.handle(req);
            }),
            catchError((err: any) => {
              console.log(err);
              // if(err.status !== 400){
              //   this.authService.logout();
              //   return empty();
              // } else{
              //   req = this.addAuthHeader(req);
              //   return next.handle(req);
              // }
              this.authService.logout();
              return empty();
            })
          )
        }
        return throwError(error);
      })
    );
  }

  refreshAccessToken(){
    if(this.refreshingAccessToken){
      return new Observable(observer => {
        this.accessTokenRefreshed.subscribe(() => {
          //this code will run when the access token has been refreshed
          observer.next();
          observer.complete();
        })
      })
    } else{
      this.refreshingAccessToken = true;
      //we want to call a method to the auth service to send a request to refresh the access token
      return this.authService.getNewAccessToken().pipe(
        tap(() => {
          console.log('Access Token Refreshed');
          this.refreshingAccessToken = false;
          this.accessTokenRefreshed.next();
        })
      )
    }
  }

  addAuthHeader(req: HttpRequest<any>){
    //get the access token
    const token = this.authService.getAccessToken();
    const id = this.authService.getUserId();

    if(token){
      //append the access token to the request header
      return req.clone({
        setHeaders: {
          'x-access-token': token,
          '_id': id
        }
      })
    }
    return req;
  }
}
