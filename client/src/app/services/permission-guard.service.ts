import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { DataSharingService } from './data-sharing.service';
import { AuthService } from './auth.service';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class PermissionGuardService implements CanActivate {

  isUserLoggedIn: boolean;
  val: boolean;
  username;

  isAdmin: boolean;
  isModerator: boolean;
  isGuest: boolean;

  constructor(private router: Router, private dataSharingService: DataSharingService, private authService: AuthService) { 
    this.dataSharingService.isUserLoggedIn.subscribe( value => {
      this.isUserLoggedIn = value;
    });

    this.dataSharingService.username.subscribe( value => {
      this.username = value;
    });

    this.dataSharingService.Admin.subscribe( value => {
      this.isAdmin = value;
    });

    this.dataSharingService.Moderator.subscribe( value => {
      this.isModerator = value;
    });

    this.dataSharingService.Guest.subscribe( value => {
      this.isGuest = value;
    });
  }

  canActivate(): boolean{
    if(localStorage.getItem('x-access-token') !== null){      
      this.authService.getUser().subscribe((res: HttpResponse<any>) => {
        this.isGuest = res.body.permission === 'user' ? true : false;
          if(!this.isGuest){
            this.isAdmin = res.body.permission === 'admin' ? true : false;
            if(!this.isAdmin){
              this.isModerator = true;
              this.dataSharingService.Moderator.next(true);
              this.dataSharingService.Admin.next(false);
              this.dataSharingService.Guest.next(false);
            }
            else{
              this.dataSharingService.Moderator.next(false);
              this.dataSharingService.Admin.next(true);
              this.dataSharingService.Guest.next(false);
            }
          } else{
            this.dataSharingService.Moderator.next(false);
            this.dataSharingService.Admin.next(false);
            this.dataSharingService.Guest.next(true);
          }
          this.dataSharingService.isUserLoggedIn.next(true);
          this.dataSharingService.username.next(res.body.username);
      }, 
      (error: HttpErrorResponse) => {
        this.authService.logout()
        this.dataSharingService.isUserLoggedIn.next(false);
        this.dataSharingService.username.next('');
      });

      if(this.isGuest === true){
        this.router.navigate(['/']);
        return false;
      } else if(this.isAdmin === true){
        return true;
      } else if(this.isModerator === true){
        return true;
      } else{
        this.router.navigate(['/']);
        return false;
      }
    }
    else{
      this.router.navigate(['/']);
      return false;
    }
  }
}
