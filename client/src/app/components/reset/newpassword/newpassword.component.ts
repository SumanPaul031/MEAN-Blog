import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-newpassword',
  templateUrl: './newpassword.component.html',
  styleUrls: ['./newpassword.component.css']
})
export class NewpasswordComponent implements OnInit {

  form: FormGroup;
  email: string;
  token: string;

  constructor(private activatedRoute: ActivatedRoute, private formBuilder: FormBuilder, private authService: AuthService, private toastr: ToastrService, private router: Router) { 
    this.createForm();

    this.activatedRoute.params.subscribe((params) => {
      this.token = params['token'];
    })
  }

  ngOnInit(): void {
    this.authService.resetPassword(this.token).subscribe((res: HttpResponse<any>) => {
      // console.log(res);
      if(res.body.success){
        this.toastr.success('Please enter a new password', 'Success');
        this.email = res.body.user.email;
      } else{
        this.router.navigate(['/login']);
        this.toastr.error(res.body.message, 'Failure');
      }
    }, 
    (err: HttpErrorResponse) => {
      // console.log(err);
      this.router.navigate(['/login']);
      this.toastr.error(err.error.message, 'Failure');
    });
  }

  createForm(){
    this.form = this.formBuilder.group({
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

  validatePassword(controls){
    const regExp = new RegExp(/^(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[\d])(?=.*?[\W]).{8,15}$/);
    if(regExp.test(controls.value)){
      return null;
    } else{
      return { 'validatePassword': true };
    }
  }

  savePassword(){
    const user = {
      email: this.email,
      password: this.form.get('password').value
    }

    this.authService.savePassword(user.email, user.password).subscribe((res: HttpResponse<any>) => {
      if(res.body.success){
        this.toastr.success(res.body.message, 'Success');
        this.router.navigate(['/login']);
      } else{
        this.router.navigate(['/newpassword', this.token]);
        this.toastr.error(res.body.message, 'Failure');
      }
    },
    (err: HttpErrorResponse) => {
      this.router.navigate(['/newpassword', this.token]);
      this.toastr.error(err.error.message, 'Failure');
    })
  }

}
