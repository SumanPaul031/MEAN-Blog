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
        // console.log(res);
      })
    )
  }

  checkUsername(username){
    return this.http.get(`/authentication/checkUsername/${username}`, { observe: 'response' }).pipe(
      tap((res: HttpResponse<any>) => {
        // console.log(res);
      })
    )
  }

  findUsers(){
    return this.http.get(`/authentication/users`, { observe: 'response' }).pipe(
      tap((res: HttpResponse<any>) => {
        // console.log(res);
      })
    )
  }

  displayUsers(username: string){
    return this.http.get(`/authentication/displayUsers/${username}`, { observe: 'response' }).pipe(
      tap((res: HttpResponse<any>) => {
        // console.log(res);
      })
    )
  } 

  profileDisplay(username: string){
    return this.http.get(`/authentication/profiledisplay/${username}`, { observe: 'response' }).pipe(
      tap((res: HttpResponse<any>) => {
        // console.log(res);
      })
    )
  }

  login(user){
    return this.http.post(`/authentication/login`, user, { observe: 'response' }).pipe(
      tap((res: HttpResponse<any>) => {
        // console.log(res);
        if(res.body.user){
          this.setSession(res.body.user._id, res.body.headers['x-access-token'], res.body.headers['x-refresh-token']);
        }
      })
    );
  }

  getNewAccessToken(){
    return this.http.get(`/authentication/access-token`, {
      headers: {
        'x-refresh-token': this.getRefreshToken(),
        '_id': this.getUserId()
      },
      observe: 'response'
    }).pipe(
      tap((res: HttpResponse<any>) => {
        this.setAccessToken(res.body.headers['x-access-token']);
      })
    )
  }

  private setSession(userId: string, accessToken: string, refreshToken: string){
    localStorage.setItem('user-id', userId);
    localStorage.setItem('x-access-token', accessToken);
    localStorage.setItem('x-refresh-token', refreshToken);
  }

  private removeSession(){
    localStorage.removeItem('user-id');
    localStorage.removeItem('x-access-token');
    localStorage.removeItem('x-refresh-token');
  }

  setAccessToken(token: string){
    localStorage.setItem('x-access-token', token);
  }

  getUser(){
    return this.http.get(`/authentication/me`, { observe: 'response' }).pipe(
      tap((res: HttpResponse<any>) => {
        console.log(res);
      })
    );
  }

  activateAccount(token: string){
    return this.http.get(`/authentication/activate/${token}`, { observe: 'response' }).pipe(
      tap((res: HttpResponse<any>) => {
        console.log(res);
      })
    );
  }

  checkResendEmail(email: string){
    return this.http.post('/authentication/resend', {email}, { observe: 'response' }).pipe(
      tap((res: HttpResponse<any>) => {
        console.log(res);
      })
    );
  }

  resendLink(email: string){
    return this.http.put('/authentication/resend', {email}, { observe: 'response' }).pipe(
      tap((res: HttpResponse<any>) => {
        console.log(res);
      })
    );
  }

  sendUsername(email: string){
    return this.http.get(`/authentication/resetusername/${email}`, {observe: 'response'}).pipe(
      tap((res: HttpResponse<any>) => {
        console.log(res);
      })
    );
  }

  sendPassword(email: string){
    return this.http.put('/authentication/resetpassword', {email}, {observe: 'response'}).pipe(
      tap((res: HttpResponse<any>) => {
        console.log(res);
      })
    );
  }

  resetPassword(token: string){
    return this.http.get(`/authentication/newpassword/${token}`, { observe: 'response' }).pipe(
      tap((res: HttpResponse<any>) => {
        console.log(res);
      })
    );
  }

  savePassword(email: string, password: string){
    return this.http.put('/authentication/savepassword', {email, password}, {observe: 'response'}).pipe(
      tap((res: HttpResponse<any>) => {
        console.log(res);
      })
    );
  }

  getAccessToken(){
    return localStorage.getItem('x-access-token');
  }

  getRefreshToken(){
    return localStorage.getItem('x-refresh-token');
  }

  getUserId(){
    return localStorage.getItem('user-id');
  }

  getUsers(){
    return this.http.get(`/authentication/management`, { observe: 'response' }).pipe(
      tap((res: HttpResponse<any>) => {
        console.log(res);
      })
    );
  }

  getEditUser(id: string){
    return this.http.get(`/authentication/edit/${id}`, { observe: 'response' }).pipe(
      tap((res: HttpResponse<any>) => {
        // this.userId = res.body._id;
     })
    );
  }

  getOwnEditUser(id: string){
    return this.http.get(`/authentication/ownedit/${id}`, { observe: 'response' }).pipe(
      tap((res: HttpResponse<any>) => {
        // this.userId = res.body._id;
     })
    );
  }

  EditUser(id: string, username: string, email: string, permission: string){
    return this.http.put(`/authentication/edit/${id}`, {username, email, permission}, {observe: 'response'}).pipe(
      tap((res: HttpResponse<any>) => {
        // this.userId = res.body._id;
     })
    );
  }

  UploadImg(id: string, username: string, email: string, permission: string, avatar){
    return this.http.post(`/authentication/profileImg/${id}`, {username, email, permission, avatar}, {observe: 'response'}).pipe(
      tap((res: HttpResponse<any>) => {
        // this.userId = res.body._id;
     })
    );
  }

  GetImg(id: string){
    return this.http.get(`/authentication/profileImg/${id}`, {observe: 'response'}).pipe(
      tap((res: HttpResponse<any>) => {
        // this.userId = res.body._id;
     })
    );
  }

  EditOwnUser(id: string, username: string, email: string, permission: string){
    return this.http.put(`/authentication/ownedit/${id}`, {username, email, permission}, {observe: 'response'}).pipe(
      tap((res: HttpResponse<any>) => {
        // this.userId = res.body._id;
     })
    );
  }

  deleteUser(email: string){
    return this.http.delete(`/authentication/management/${email}`, { observe: 'response' }).pipe(
      tap((res: HttpResponse<any>) => {
        // this.userId = res.body._id;
     })
    );
  }

  logout(){
    this.removeSession();
    this.router.navigate(['/']);
  }
}
