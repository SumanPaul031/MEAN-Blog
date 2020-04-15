import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {

  form: FormGroup;
  usernameAvailable: boolean = true;
  usernameAvailableMsg: string;
  emailAvailable: boolean = true;
  emailAvailableMsg: string;

  constructor(private formBuilder: FormBuilder, private authService: AuthService, private toastr: ToastrService, private router: Router) { 
    this.createForm();
  }

  ngOnInit(): void {
  }

  createForm(){
    this.form = this.formBuilder.group({
      email: ['', Validators.compose([
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(30),
        this.validateEmail
      ])],
      username: ['', Validators.compose([
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(15),
        this.validateUsername
      ])],
      password: ['', Validators.compose([
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(15),
        this.validatePassword
      ])],
      confirm: ['', Validators.required]
    }, { validator: this.matchingPasswords('password', 'confirm')})
  }

  matchingPasswords(password, confirm){
    return (group: FormGroup) => {
      if(group.controls[password].value === group.controls[confirm].value){
        return null;
      } else{
        return { 'matchingPasswords': true };
      }
    }
  }

  validateEmail(controls){
    const regExp = new RegExp(/^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/);
    if(regExp.test(controls.value)){
      return null;
    } else{
      return { 'validateEmail': true };
    }
  }

  validateUsername(controls){
    const regExp = new RegExp(/^[a-zA-Z0-9]+$/);
    if(regExp.test(controls.value)){
      return null;
    } else{
      return { 'validateUsername': true };
    }
  }

  validatePassword(controls){
    const regExp = new RegExp(/^(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[\d])(?=.*?[\W]).{8,15}$/);
    if(regExp.test(controls.value)){
      return null;
    } else{
      return { 'validatePassword': true };
    }
  }

  onRegisterSubmit(){
    // console.log(this.form);
    const user = {
      email: this.form.get('email').value,
      username: this.form.get('username').value,
      password: this.form.get('password').value
    }

    this.authService.registerUser(user).subscribe((res: HttpResponse<any>) => {
      // console.log('Success: '+res.body.message);
      if(res.body.success){
        this.toastr.success(res.body.message, 'Success');
        this.router.navigate(['/login']);
      } else{
        this.toastr.error(res.body.message, 'Failure');
        this.router.navigate(['/register']);
      }      
    },
    (err: HttpErrorResponse) => {
      console.log('Failure: '+err.error);
      // this.toastr.error(err.error.message, 'Failure');
      this.router.navigate(['/register']);
    })
  }

  checkUsername(){
    this.authService.checkUsername(this.form.get('username').value).subscribe((res: HttpResponse<any>) => {
      if(res.body.success){
        this.usernameAvailable = true;
        this.usernameAvailableMsg = '';
      } else{
        this.usernameAvailable = false;
        this.usernameAvailableMsg = res.body.message;
      }
    }, 
    (err: HttpErrorResponse) => {
      console.log('Failure: '+err.error);
    })
  }

  checkEmail(){
    this.authService.checkEmail(this.form.get('email').value).subscribe((res: HttpResponse<any>) => {
      if(res.body.success){
        this.emailAvailable = true;
        this.emailAvailableMsg = '';
      } else{
        this.emailAvailable = false;
        this.emailAvailableMsg = res.body.message;
      }
    }, 
    (err: HttpErrorResponse) => {
      console.log('Failure: '+err.error);
    })
  }
}
