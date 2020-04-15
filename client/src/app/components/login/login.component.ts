import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { DataSharingService } from 'src/app/services/data-sharing.service';
import { AuthGuardService } from 'src/app/services/auth-guard.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  form: FormGroup;
  isUserLoggedIn: boolean;
  username;
  previousUrl;

  constructor(
    private formBuilder: FormBuilder, 
    private authService: AuthService, 
    private toastr: ToastrService, 
    private router: Router,
    private dataSharingService: DataSharingService,
    private authGuard: AuthGuardService) { 
    this.createForm();

    this.dataSharingService.isUserLoggedIn.subscribe( value => {
      this.isUserLoggedIn = value;
    });

    this.dataSharingService.username.subscribe( value => {
      this.username = value;
    });
  }

  ngOnInit(): void {
    // if(this.authGuard.redirectUrl){
    //   this.previousUrl = this.authGuard.redirectUrl;
    //   this.authGuard.redirectUrl = undefined;
    // }
  }

  createForm(){
    this.form = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    })
  }

  onLoginSubmit(){
    // console.log(this.form);
    const user = {
      username: this.form.get('username').value,
      password: this.form.get('password').value
    }

    this.authService.login(user).subscribe((res: HttpResponse<any>) => {
      console.log('Success: '+res.body.message);
      if(res.body.success){
        this.toastr.success(res.body.message, 'Success');
        // if(this.previousUrl){
        //   this.router.navigate([this.previousUrl]);
        // } else{
        //   this.router.navigate(['/profile']);
        // }
        this.router.navigate(['/profile']);
        this.dataSharingService.isUserLoggedIn.next(true);
        this.dataSharingService.username.next(user.username);
      } else{
        this.toastr.error(res.body.message, 'Failure');
        this.router.navigate(['/login']);
        this.dataSharingService.isUserLoggedIn.next(false);
        this.dataSharingService.username.next('');
      }      
    },
    (err: HttpErrorResponse) => {
      console.log(err);
      // this.toastr.error(err.error.message, 'Failure');
      this.router.navigate(['/login']);
      this.dataSharingService.isUserLoggedIn.next(false);
      this.dataSharingService.username.next('');
    })
  }

}
