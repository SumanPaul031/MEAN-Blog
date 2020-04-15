import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { DataSharingService } from 'src/app/services/data-sharing.service';
import { Router } from '@angular/router';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';

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

  constructor(private authService: AuthService, 
    private toastr: ToastrService,
    private dataSharingService: DataSharingService,
    private router: Router) { 
      this.dataSharingService.isUserLoggedIn.subscribe( value => {
        this.isUserLoggedIn = value;
      });

      this.dataSharingService.username.subscribe( value => {
        this.username = value;
      });
  }

  ngOnInit(): void {
    this.val = localStorage.getItem('token') ? true : false;

    if(this.val){
      this.authService.getUser().subscribe((res: HttpResponse<any>) => {
        this.dataSharingService.isUserLoggedIn.next(true);
        this.dataSharingService.username.next(res.body.username);
      }, 
      (error: HttpErrorResponse) => {
        // console.log(error.error);
        this.authService.logout()
        this.dataSharingService.isUserLoggedIn.next(false);
        this.dataSharingService.username.next('');
      })
    } else{
      this.dataSharingService.isUserLoggedIn.next(false);
      this.dataSharingService.username.next('');
    }
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
