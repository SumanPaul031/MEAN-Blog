import { Component, OnInit } from '@angular/core';
import { DataSharingService } from 'src/app/services/data-sharing.service';
import { AuthService } from 'src/app/services/auth.service';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  isUserLoggedIn: boolean;
  val: boolean;
  username;

  isAdmin: boolean;
  isModerator: boolean;
  isGuest: boolean;
  avatarImg: object;

  users;

  loading: boolean = true;

  hasProfileImg: boolean;
  path;

  constructor(
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

  ngOnInit(): void {
    this.val = localStorage.getItem('x-access-token') ? true : false;

    if(this.val){
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
          this.username = res.body.username;
          this.dataSharingService.isUserLoggedIn.next(true);
          this.dataSharingService.username.next(res.body.username);
          this.displayImg(res.body._id);
          this.findUsers(res.body._id);
          this.loading = false;
      }, 
      (error: HttpErrorResponse) => {
        // console.log(error.error);
        this.authService.logout()
        this.dataSharingService.isUserLoggedIn.next(false);
        this.dataSharingService.username.next('');
        this.loading = false;
      })
    } else{
      this.dataSharingService.isUserLoggedIn.next(false);
      this.dataSharingService.username.next('');
      this.loading = false;
    }
  }

  findUsers(id: string){
    this.authService.findUsers().subscribe((res: HttpResponse<any>) => {
      if(res.body.success){
        const mid = res.body.users.filter(item => {
          if(item._id === id){
            return false;
          }
          if(this.isGuest && ((item.permission === 'moderator') || (item.permission === 'admin'))){
            return false;
          }
          if(this.isModerator && (item.permission === 'admin')){
            return false;
          }
          return true;
        });
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
