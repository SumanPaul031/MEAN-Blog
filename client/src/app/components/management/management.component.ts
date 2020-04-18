import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, FormControl, FormGroupDirective, NgForm, Validators } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';
import { DataSharingService } from 'src/app/services/data-sharing.service';
import { ToastrService } from 'ngx-toastr';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-management',
  templateUrl: './management.component.html',
  styleUrls: ['./management.component.css']
})
export class ManagementComponent implements OnInit {

  loading: boolean = true;

  users;

  isMainAdmin: boolean;
  isMainModerator: boolean;
  isMainGuest: boolean;

  isUserLoggedIn: boolean;

  callerIsAdmin: boolean;

  username;

  editid: string;
  editemail: string;
  editpermission: string;
  editusername: string;

  formusername = new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(15), Validators.pattern('^[a-zA-Z0-9]+$')]);
  formemail = new FormControl('', [Validators.required, Validators.minLength(5), Validators.maxLength(30), Validators.email]);

  isAdmin: boolean;
  isModerator: boolean;
  isGuest: boolean;

  pageSize: number = 2;
  p: number = 1;

  mainUserId;
  mainUserEmail;

  constructor(
    private authService: AuthService, 
    private dataSharingService: DataSharingService, 
    private toastr: ToastrService
  ) { 
    this.dataSharingService.isUserLoggedIn.subscribe( value => {
      this.isUserLoggedIn = value;
    });

    this.dataSharingService.username.subscribe( value => {
      this.username = value;
    });

    this.dataSharingService.Admin.subscribe( value => {
      this.isMainAdmin = value;
    });

    this.dataSharingService.Moderator.subscribe( value => {
      this.isMainModerator = value;
    });

    this.dataSharingService.Guest.subscribe( value => {
      this.isMainGuest = value;
    });
  }

  ngOnInit(): void {
    this.authService.getUser().subscribe((res: HttpResponse<any>) => {
      this.isMainGuest = res.body.permission === 'user' ? true : false;
        if(!this.isMainGuest){
          this.isMainAdmin = res.body.permission === 'admin' ? true : false;
          if(!this.isMainAdmin){
            this.isMainModerator = true;
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
        this.mainUserId = res.body._id;
        this.mainUserEmail = res.body.email;
        this.dataSharingService.isUserLoggedIn.next(true);
        this.dataSharingService.username.next(res.body.username);
    }, 
    (error: HttpErrorResponse) => {
      // console.log(error.error);
      this.authService.logout()
      this.dataSharingService.isUserLoggedIn.next(false);
      this.dataSharingService.username.next('');
    });

    this.getUsers();
  }

  getUsers(){
    this.authService.getUsers().subscribe((res: HttpResponse<any>) => {
      if(res.body.success){
        this.users = res.body.users.filter((item) => item.email !== this.mainUserEmail);
        this.loading = false;
      } else{
        console.log(res.body.message);
        this.loading = false;
      }
    },
    (error: HttpErrorResponse) => {
      console.log(error.error.message);
      this.loading = false;
    });
  }

  usernameSearch(){
    // Declare variables
    var input, filter, table, tr, td, i, txtValue;
    input = document.getElementById("usernameInput");
    filter = input.value.toUpperCase();
    table = document.getElementById("myTable");
    tr = table.getElementsByTagName("tr");

    // Loop through all table rows, and hide those who don't match the search query
    for (i = 0; i < tr.length; i++) {
      td = tr[i].getElementsByTagName("td")[0];
      if (td) {
        txtValue = td.textContent || td.innerText;
        if (txtValue.toUpperCase().indexOf(filter) > -1) {
          tr[i].style.display = "";
        } else {
          tr[i].style.display = "none";
        }
      }
    }
  }

  emailSearch(){
    // Declare variables
    var input, filter, table, tr, td, i, txtValue;
    input = document.getElementById("emailInput");
    filter = input.value.toUpperCase();
    table = document.getElementById("myTable");
    tr = table.getElementsByTagName("tr");

    // Loop through all table rows, and hide those who don't match the search query
    for (i = 0; i < tr.length; i++) {
      td = tr[i].getElementsByTagName("td")[1];
      if (td) {
        txtValue = td.textContent || td.innerText;
        if (txtValue.toUpperCase().indexOf(filter) > -1) {
          tr[i].style.display = "";
        } else {
          tr[i].style.display = "none";
        }
      }
    }
  }

  sortTable(n) {
    var table, rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
    table = document.getElementById("myTable");
    switching = true;
    // Set the sorting direction to ascending:
    dir = "asc";
    /* Make a loop that will continue until
    no switching has been done: */
    while (switching) {
      // Start by saying: no switching is done:
      switching = false;
      rows = table.rows;
      /* Loop through all table rows (except the
      first, which contains table headers): */
      for (i = 1; i < (rows.length - 1); i++) {
        // Start by saying there should be no switching:
        shouldSwitch = false;
        /* Get the two elements you want to compare,
        one from current row and one from the next: */
        x = rows[i].getElementsByTagName("td")[n];
        y = rows[i + 1].getElementsByTagName("td")[n];
        /* Check if the two rows should switch place,
        based on the direction, asc or desc: */
        if (dir == "asc") {
          if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
            // If so, mark as a switch and break the loop:
            shouldSwitch = true;
            break;
          }
        } else if (dir == "desc") {
          if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
            // If so, mark as a switch and break the loop:
            shouldSwitch = true;
            break;
          }
        }
      }
      if (shouldSwitch) {
        /* If a switch has been marked, make the switch
        and mark that a switch has been done: */
        rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
        switching = true;
        // Each time a switch is done, increase this count by 1:
        switchcount ++;
      } else {
        /* If no switching has been done AND the direction is "asc",
        set the direction to "desc" and run the while loop again. */
        if (switchcount == 0 && dir == "asc") {
          dir = "desc";
          switching = true;
        }
      }
    }
  }

  onEditClick(id: string){
    // this.name = 'Raghu';
    // this.editid = id;    

    this.authService.getEditUser(id).subscribe((res: HttpResponse<any>) => {
      if(res.body.success){
        console.log(res);
        this.editid = res.body.user._id;
        this.editusername = res.body.user.username;
        this.editemail = res.body.user.email;
        this.editpermission = res.body.user.permission;
        this.callerIsAdmin = res.body.caller.permission === 'admin' ? true : false;
        if(this.editpermission === 'user'){
          this.isGuest = true;
          this.isAdmin = false;
          this.isModerator = false;
        } else if(this.editpermission === 'admin'){
          this.isAdmin = true;
          this.isGuest = false;
          this.isModerator = false
        } else if(this.editpermission === 'moderator'){
          this.isModerator = true;
          this.isAdmin = false;
          this.isGuest = false;
        }
      } else{
        this.toastr.error(res.body.message, 'Failure');
      }
    }, 
    (error: HttpErrorResponse) => {
      this.toastr.error(error.error.message, 'Failure');
      // this.router.navigate(['/login']);
    });
  }

  usernameErrorMessage(){
    if (this.formusername.hasError('required')) {
      return 'You must enter a username';
    } else if(this.formusername.hasError('pattern')){
      return 'Username should contain only alphabets and numbers. No special characters or spaces';
    } else if(this.formusername.hasError('minlength')){
      return 'Username should be atleast 3 characters long'
    } else if(this.formusername.hasError('maxlength')){
      return 'Username should not be more than 15 characters long'
    } else {
      return '';
    }
  }

  emailErrorMessage(){
    if (this.formemail.hasError('required')) {
      return 'You must enter an email';
    } else if(this.formemail.hasError('email')){
      return 'Please enter a valid email';
    } else if(this.formemail.hasError('minlength')){
      return 'Email should be atleast 5 characters long'
    } else if(this.formemail.hasError('maxlength')){
      return 'Email should not be more than 30 characters long'
    } else {
      return '';
    }
  }

  DeleteClick(id: string){
    // this.name = 'Raghu';
    // this.editid = id;
    this.authService.getEditUser(id).subscribe((res: HttpResponse<any>) => {
      if(res.body.success){
        this.editusername = res.body.user.username;
        this.editemail = res.body.user.email;
      } else{
        this.toastr.error(res.body.message, 'Failure');
      }
    }, 
    (error: HttpErrorResponse) => {
      this.toastr.error(error.error.message, 'Failure');
      // this.router.navigate(['/login']);
    });
  }

  onUpdateClick(){
    this.authService.EditUser(this.editid, this.editusername, this.editemail, this.editpermission).subscribe((res: HttpResponse<any>) => {
      if(res.body.success){
        this.toastr.success(res.body.message, 'Success');
        this.getUsers();
      } else{
        this.toastr.error(res.body.message, 'Failure');
      }
    },
    (err: HttpErrorResponse) => {
      this.toastr.error(err.error.message, 'Failure');
    })
  }

  grantAdmin(){
    // console.log(this.permission);
    this.isAdmin = true;
    this.isModerator = false;
    this.isGuest = false;
    this.editpermission = 'admin';
    this.authService.EditUser(this.editid, this.editusername, this.editemail, this.editpermission).subscribe((res: HttpResponse<any>) => {
      if(res.body.success){
        this.toastr.success(res.body.message, 'Success');
        this.getUsers();
      } else{
        this.toastr.error(res.body.message, 'Failure');
      }
    },
    (err: HttpErrorResponse) => {
      this.toastr.error(err.error.message, 'Failure');
    })
  }

  grantModerator(){
    // console.log(this.permission);
    this.isModerator = true;
    this.isAdmin = false;
    this.isGuest = false;
    this.editpermission = 'moderator';
    this.authService.EditUser(this.editid, this.editusername, this.editemail, this.editpermission).subscribe((res: HttpResponse<any>) => {
      if(res.body.success){
        this.toastr.success(res.body.message, 'Success');
        this.getUsers();
      } else{
        this.toastr.error(res.body.message, 'Failure');
      }
    },
    (err: HttpErrorResponse) => {
      this.toastr.error(err.error.message, 'Failure');
    })
  }

  grantUser(){
    // console.log(this.permission)
    this.isGuest = true;
    this.isAdmin = false;
    this.isModerator = false;
    this.editpermission = 'user';
    this.authService.EditUser(this.editid, this.editusername, this.editemail, this.editpermission).subscribe((res: HttpResponse<any>) => {
      if(res.body.success){
        this.toastr.success(res.body.message, 'Success');
        this.getUsers();
      } else{
        this.toastr.error(res.body.message, 'Failure');
      }
    },
    (err: HttpErrorResponse) => {
      this.toastr.error(err.error.message, 'Failure');
    })
  }

  onDeleteClick(email: string){
    this.authService.deleteUser(email).subscribe((res: HttpResponse<any>) => {
      if(res.body.success){
        this.toastr.success(res.body.message + email, 'Success');
        this.getUsers();
      } else{
        console.log(res.body.message);
      }
    },
    (err: HttpErrorResponse) => {
      console.log(err.error.message);
    });
  }

}
