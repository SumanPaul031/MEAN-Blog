import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { DataSharingService } from './data-sharing.service';
import { AuthService } from './auth.service';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';

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
  avatarImg: object;

  users;

  hasProfileImg: boolean;
  path;

  constructor(
    private router: Router, 
    private dataSharingService: DataSharingService, 
    private authService: AuthService, 
    private sanitizer: DomSanitizer) { 
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

    this.dataSharingService.avatarImg.subscribe( value => {
      this.avatarImg = value;
    });

    this.dataSharingService.users.subscribe( value => {
      this.users = value;
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
          this.displayImg(res.body._id);
          this.findUsers(res.body._id);
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

  findUsers(id: string){
    this.authService.findUsers().subscribe((res: HttpResponse<any>) => {
      if(res.body.success){
        const mid = res.body.users.filter((item) => item._id !== id);
        // this.loading = false;
        this.users = mid.map(item => item.username);
        this.dataSharingService.users.next(this.users);
        // console.log(typeof this.users);
        // console.log(this.users);
      } else{
        console.log(res.body.message);
        // this.loading = false;
        this.dataSharingService.users.next([]);
      }
    },
    (error: HttpErrorResponse) => {
      console.log(error.error.message);
      // this.loading = false;
      this.dataSharingService.users.next([]);
    });
  }

  displayImg(id: string){
    this.authService.GetImg(id).subscribe((res: HttpResponse<any>) => {
      if(res.body.success){
        this.hasProfileImg = true;
        // this.path = res.body.path;
        this.path = this.sanitizer.bypassSecurityTrustResourceUrl(res.body.path);
        this.dataSharingService.avatarImg.next(this.path);
      } else{
        this.hasProfileImg = false;
        this.dataSharingService.avatarImg.next({});
      }
    }, (err: HttpErrorResponse) => {
      this.hasProfileImg = false;
      this.dataSharingService.avatarImg.next({});
    })
  }
}
