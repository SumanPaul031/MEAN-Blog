import { Component, OnInit } from '@angular/core';
import { DataSharingService } from 'src/app/services/data-sharing.service';
import { AuthService } from 'src/app/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { DomSanitizer } from '@angular/platform-browser';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-profiledisplay',
  templateUrl: './profiledisplay.component.html',
  styleUrls: ['./profiledisplay.component.css']
})
export class ProfiledisplayComponent implements OnInit {

  isUserLoggedIn: boolean;
  mainusername;
  isAdmin: boolean;
  isModerator: boolean;
  isGuest: boolean;
  mainAvatarImg: object;
  val: boolean;
  mainid: string;
  mainemail: string;
  mainpermission: string;

  mainhasProfileImg: boolean;
  mainpath;

  hasProfileImg: boolean;
  username: string;
  email: string;
  path;

  users;

  loading: boolean = false;

  constructor(
    private dataSharingService: DataSharingService,
    private authService: AuthService,
    private toastr: ToastrService,
    private sanitizer: DomSanitizer,
    private activatedRoute: ActivatedRoute,
    private router: Router) { 
      this.dataSharingService.isUserLoggedIn.subscribe( value => {
        this.isUserLoggedIn = value;
      });
  
      this.dataSharingService.username.subscribe( value => {
        this.mainusername = value;
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
        this.mainAvatarImg = value;
      });

      this.dataSharingService.users.subscribe( value => {
        this.users = value;
      });

      this.activatedRoute.params.subscribe((params) => {
        this.username = params['username'];
      });
  }

  ngOnInit(): void {
    this.val = localStorage.getItem('x-access-token') ? true : false;

    if(this.val){
      this.authService.getUser().subscribe((res: HttpResponse<any>) => {
        // console.log(res);
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

          // console.log(res.body._id);
          this.mainpermission = res.body.permission;
          this.mainusername = res.body.username;
          this.mainemail = res.body.email;
          this.mainid = res.body._id;
          this.dataSharingService.isUserLoggedIn.next(true);
          this.dataSharingService.username.next(res.body.username);
          
          this.displayImg(this.mainid);

          this.profileDisplay(this.username);

          this.findUsers(this.mainid);

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
        this.mainhasProfileImg = true;
        // this.path = res.body.path;
        this.mainpath = this.sanitizer.bypassSecurityTrustResourceUrl(res.body.path);
        this.dataSharingService.avatarImg.next(this.mainpath);
      } else{
        this.mainhasProfileImg = false;
        this.dataSharingService.avatarImg.next({});
      }
    }, (err: HttpErrorResponse) => {
      this.mainhasProfileImg = false;
      this.dataSharingService.avatarImg.next({});
    })
  }

  profileDisplay(username: string){
    this.authService.profileDisplay(username).subscribe((res: HttpResponse<any>) => {
      if(res.body.success){
        this.authService.GetImg(res.body.user._id).subscribe((res: HttpResponse<any>) => {
          if(res.body.success){
            this.hasProfileImg = true;
            this.path = this.sanitizer.bypassSecurityTrustResourceUrl(res.body.path);
          } else{
            this.hasProfileImg = false;
          }
        }, (err: HttpErrorResponse) => {
          this.hasProfileImg = false;
        })
        this.username = res.body.user.username;
        this.email = res.body.user.email;
      } else{
        console.log(res.body);
        this.toastr.error(res.body.message, 'Failure');
        this.router.navigate(['/']);
      }
    }, (err: HttpErrorResponse) => {
      console.log(err.error);
      this.router.navigate(['/']);
    })
  }

}
