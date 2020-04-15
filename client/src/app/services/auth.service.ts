import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient) { }

  registerUser(user){
    return this.http.post(`/authentication/register`, user, { observe: 'response' }).pipe(
      tap((res: HttpResponse<any>) => {
        console.log(res);
      })
    )
  }

  checkEmail(email){
    return this.http.get(`/authentication/checkEmail/${email}`, { observe: 'response' }).pipe(
      tap((res: HttpResponse<any>) => {
        console.log(res);
      })
    )
  }

  checkUsername(username){
    return this.http.get(`/authentication/checkUsername/${username}`, { observe: 'response' }).pipe(
      tap((res: HttpResponse<any>) => {
        console.log(res);
      })
    )
  }
}
