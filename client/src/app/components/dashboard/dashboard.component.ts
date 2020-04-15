import { Component, OnInit } from '@angular/core';
import { DataSharingService } from 'src/app/services/data-sharing.service';
import { AuthService } from 'src/app/services/auth.service';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  isUserLoggedIn: boolean;
  val: boolean;
  username;

  constructor(
    private dataSharingService: DataSharingService,
    private authService: AuthService) { 
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
        this.username = res.body.username;
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

}
