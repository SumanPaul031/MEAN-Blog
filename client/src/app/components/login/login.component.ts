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

  form1: FormGroup;
  email;
  
  expired: boolean = false;
  incusername: boolean = false;
  incpassword: boolean = false;

  isAdmin: boolean;
  isGuest: boolean;
  isModerator: boolean;

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
    });

    this.form1 = this.formBuilder.group({
      email: ['', Validators.compose([
        Validators.required,
        this.validateEmail
      ])]
    })
  }

  validateEmail(controls){
    const regExp = new RegExp(/^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/);
    if(regExp.test(controls.value)){
      return null;
    } else{
      return { 'validateEmail': true };
    }
  }

  onLoginSubmit(){
    // console.log(this.form);
    const user = {
      username: this.form.get('username').value,
      password: this.form.get('password').value
    }

    this.authService.login(user).subscribe((res: HttpResponse<any>) => {
      
      if(res.body.success){
        this.isGuest = res.body.user.permission === 'user' ? true : false;
        if(!this.isGuest){
          this.isAdmin = res.body.user.permission === 'admin' ? true : false;
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
        this.toastr.success(res.body.message, 'Success');        
        this.router.navigate(['/profile']);
        this.dataSharingService.isUserLoggedIn.next(true);
        this.dataSharingService.username.next(user.username);
        console.log('Success: '+res.body.message);
      } else{
        this.toastr.error(res.body.message, 'Failure');
        this.router.navigate(['/login']);
        if(res.body.expired){
          this.expired = true;
          this.incusername = false;
          this.incpassword = false;
        } else if(res.body.message === 'Username Not Found'){
          this.incusername = true;
          this.incpassword = false;
        } else if(res.body.message === 'Incorrect Password'){
          this.incpassword = true;
          this.incusername = false;
        }
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

  onResendSubmit(){
    this.authService.checkResendEmail(this.form1.get('email').value).subscribe((res: HttpResponse<any>) => {
      // console.log(res);
      if(res.body.success){
        this.authService.resendLink(this.form1.get('email').value).subscribe((res: HttpResponse<any>) => {
          if(res.body.success){
            this.toastr.success(res.body.message, 'Success');
            this.router.navigate(['/login']);
          } else{
            this.toastr.error(res.body.message, 'Failure');
            // this.router.navigate(['/login']);
          }
        })
      } else{
        this.toastr.error(res.body.message, 'Failure');
        // this.router.navigate(['/login']);
      }
    },
    (err: HttpErrorResponse) => {
      // console.log(err.error.message);
      this.toastr.error(err.error.message, 'Failure');
      this.router.navigate(['/login']);
    })
  }

  sendUsername(){
    this.authService.sendUsername(this.form1.get('email').value).subscribe((res: HttpResponse<any>) => {
      // console.log(res);
      if(res.body.success){
        this.toastr.success(res.body.message, 'Success');
        this.router.navigate(['/login']);
      } else{
        this.toastr.error(res.body.message, 'Failure');
        // this.router.navigate(['/login']);
        if(res.body.expired){
          this.expired = true;
        }
      }
    },
    (err: HttpErrorResponse) => {
      // console.log(err.error.message);
      this.toastr.error(err.error.message, 'Failure');
      this.router.navigate(['/login']);
    })
  }

  sendPassword(){
    this.authService.sendPassword(this.form1.get('email').value).subscribe((res: HttpResponse<any>) => {
      // console.log(res);
      if(res.body.success){
        this.toastr.success(res.body.message, 'Success');
        this.router.navigate(['/login']);
      } else{
        this.toastr.error(res.body.message, 'Failure');
        // this.router.navigate(['/login']);
        if(res.body.expired){
          this.expired = true;
        }
      }
    },
    (err: HttpErrorResponse) => {
      // console.log(err.error.message);
      this.toastr.error(err.error.message, 'Failure');
      this.router.navigate(['/login']);
    })
  }

}
