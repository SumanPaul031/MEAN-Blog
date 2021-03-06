import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { DataSharingService } from 'src/app/services/data-sharing.service';
import { FormGroup, FormBuilder, FormControl, FormGroupDirective, NgForm, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {

  isCollapsed = true;
  isUserLoggedIn: boolean;
  val: boolean;
  username;
  avatarImg: object;

  isAdmin: boolean;
  isModerator: boolean;
  isGuest: boolean;

  hasProfileImg: boolean;
  path;

  id;

  myControl = new FormControl();
  // options: string[] = ['Delhi', 'Mumbai', 'Banglore'];
  public options = [
    "Burgers",
    "Sandwiches",
    "French Fries",
    "Milkshakes",
    "Taco",
    "Biscuit",
    "Cookies",
    "Hot Dog",
    "Pizza",
    "Pancake"
  ];

  users;
  // public search1 = '';
  formusername = new FormControl('', [Validators.required]);
  editusername: string;

  loading: boolean = true;

  constructor(private authService: AuthService, 
    private toastr: ToastrService,
    private dataSharingService: DataSharingService,
    private router: Router,
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

  // selectedStatic(result) {
  //   this.search1 = result;
  // }

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
          this.id = res.body._id;
          this.dataSharingService.isUserLoggedIn.next(true);
          this.dataSharingService.username.next(res.body.username);
          this.displayImg(this.id);
          this.findUsers(this.id)
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
        console.log(typeof this.users);
        console.log(this.users);
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

  displayUserProfile(){
    // console.log(this.editusername);
    this.isCollapsed = !this.isCollapsed;
    this.authService.displayUsers(this.editusername).subscribe((res: HttpResponse<any>) => {
      if(res.body.success){
        console.log(res.body.users.length);
        if(res.body.users.length > 1){
          this.router.navigate(['/users', this.editusername]);
        } else{
          this.router.navigate(['/profiledisplay', this.editusername]);
        }
      } else{
        console.log(res.body.message);
        this.toastr.error(res.body.message, 'Failure');
        // this.loading = false;
      }
    },
    (error: HttpErrorResponse) => {
      console.log(error.error.message);
      // this.loading = false;
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

  onLogoutBtnClick(){
    this.isCollapsed = !this.isCollapsed;
    this.authService.logout();
    this.toastr.success('You have Logged Out successfully', 'Success');
    this.router.navigate(['/']);
    this.dataSharingService.isUserLoggedIn.next(false);
    this.dataSharingService.username.next('');
  }

}
