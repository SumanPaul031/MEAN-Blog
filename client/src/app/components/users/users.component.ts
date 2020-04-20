import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { DataSharingService } from 'src/app/services/data-sharing.service';
import { ToastrService } from 'ngx-toastr';
import { DomSanitizer } from '@angular/platform-browser';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {

  isUserLoggedIn: boolean;
  mainusername;
  isMainAdmin: boolean;
  isMainModerator: boolean;
  isMainGuest: boolean;
  avatarImg: object;

  hasProfileImg: boolean;
  path;

  mainUserId;
  mainUserEmail;

  username;

  users1;
  users;

  pageSize: number = 2;
  p: number = 1;

  loading: boolean = true;

  constructor(
    private authService: AuthService, 
    private dataSharingService: DataSharingService, 
    private toastr: ToastrService,
    private sanitizer: DomSanitizer,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) { 
    this.dataSharingService.isUserLoggedIn.subscribe( value => {
      this.isUserLoggedIn = value;
    });

    this.dataSharingService.username.subscribe( value => {
      this.mainusername = value;
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

    this.dataSharingService.avatarImg.subscribe( value => {
      this.avatarImg = value;
    });

    this.activatedRoute.params.subscribe((params) => {
      this.username = params['username'];
    })
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
        this.displayImg(res.body._id);
        // this.findUsers(res.body._id);
    }, 
    (error: HttpErrorResponse) => {
      // console.log(error.error);
      this.authService.logout()
      this.dataSharingService.isUserLoggedIn.next(false);
      this.dataSharingService.username.next('');
    });

    this.displayUserProfile();
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

  displayUserProfile(){
    // console.log(this.username);
    this.authService.displayUsers(this.username).subscribe((res: HttpResponse<any>) => {
      if(res.body.success){
        if(res.body.users.length > 1){
          // const mid = res.body.users.filter((item) => item._id !== this.mainUserId);
          // this.users = mid.map(item => item.username);
          this.users1 = res.body.users.filter(item => {
            if(item._id === this.mainUserId){
              return false;
            }
            if(this.isMainGuest && ((item.permission === 'moderator') || (item.permission === 'admin'))){
              return false;
            }
            if(this.isMainModerator && (item.permission === 'admin')){
              return false;
            }
            return true;
          });
          this.loading = false;
        } else{
          this.router.navigate(['/profiledisplay', this.username]);
          this.loading = false;
        }
      } else{
        console.log(res.body.message);
        this.toastr.error(res.body.message, 'Failure');
        this.router.navigate(['/']);
        this.loading = false;
        // this.loading = false;
      }
    },
    (error: HttpErrorResponse) => {
      console.log(error.error.message);
      this.loading = false;
      // this.loading = false;
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

}
