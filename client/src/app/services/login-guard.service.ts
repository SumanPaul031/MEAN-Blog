import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class LoginGuardService implements CanActivate {

  constructor(private router: Router) { }

  canActivate(): boolean{
    if(localStorage.getItem('x-access-token') !== null){
      this.router.navigate(['/']);
      return false;
    }
    return true;
  }
}
