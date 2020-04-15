import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient, private router: Router) { }

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

  login(user){
    return this.http.post(`/authentication/login`, user, { observe: 'response' }).pipe(
      tap((res: HttpResponse<any>) => {
        // console.log(res);
        if(res.body.user){
          this.storeUserData(res.body.token, res.body.user.username);
        }
      })
    );
  }

  storeUserData(token, username){
    localStorage.setItem('token', token);
    localStorage.setItem('user', username);
  }

  removeUserData(){
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  getUser(){
    return this.http.get(`/authentication/me`, { observe: 'response' }).pipe(
      tap((res: HttpResponse<any>) => {
        console.log(res);
      })
    );
  }

  getAccessToken(){
    return localStorage.getItem('token');
  }

  logout(){
    this.removeUserData();
    this.router.navigate(['/']);
  }
}
