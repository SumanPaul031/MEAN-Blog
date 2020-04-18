import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'src/app/services/auth.service';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-activate',
  templateUrl: './activate.component.html',
  styleUrls: ['./activate.component.css']
})
export class ActivateComponent implements OnInit {

  token: string;

  constructor(
    private activatedRoute: ActivatedRoute, 
    private authService: AuthService, 
    private toastr: ToastrService,
    private router: Router
  ) { 
    this.activatedRoute.params.subscribe((params) => {
      this.token = params['token'];
    })
  }

  ngOnInit(): void {
    this.authService.activateAccount(this.token).subscribe((res: HttpResponse<any>) => {
      if(res.body.success){
        this.router.navigate(['/login']);
        this.toastr.success(res.body.message, 'Success');
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

}
