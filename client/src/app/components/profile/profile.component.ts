import { Component, OnInit, ViewChild } from '@angular/core';
import { DataSharingService } from 'src/app/services/data-sharing.service';
import { AuthService } from 'src/app/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { FormControl, Validators } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {

  isUserLoggedIn: boolean;
  val: boolean;
  username;
  email;
  id;
  permission;

  isAdmin: boolean;
  isModerator: boolean;
  isGuest: boolean;
  avatarImg: object;

  formusername = new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(15), Validators.pattern('^[a-zA-Z0-9]+$')]);
  formemail = new FormControl('', [Validators.required, Validators.minLength(5), Validators.maxLength(30), Validators.email]);

  editid: string;
  editemail: string;
  editpermission: string;
  editusername: string;

  isFileChosen:boolean = false;
  filename: string = '';

  imgAdded: boolean = false

  file;

  image;

  hasProfileImg: boolean;
  path;

  users;

  loading: boolean = true;

  @ViewChild('myPond') myPond: any;
 
  pondOptions = {
    class: 'filepond',
    multiple: false,
    labelIdle: 'Drop files here',
    acceptedFileTypes: 'image/jpeg, image/png, image/jpg, image/gif',
    name: 'avatar'
  }
 
  pondFiles = []
 
  pondHandleInit() {}
 
  pondHandleAddFile($event) {
    this.imgAdded = true;
    this.readThis($event.file);
  }

  pondHandleRemoveFile(event: any) {
    this.imgAdded = false;
  }

  readThis(inputValue: any): void {
    var file:File = inputValue.file;
    var myReader:FileReader = new FileReader();
  
    myReader.onloadend = (e) => {
      this.image = myReader.result;
      this.displayCode();
    }
    myReader.readAsDataURL(file);
  }

  displayCode(){
    const avatar = {
      type: this.image.split(";")[0].slice(5),
      data: this.image.split(";")[1].slice(7)
    }
    return avatar;
  }

  constructor(
    private dataSharingService: DataSharingService,
    private authService: AuthService,
    private toastr: ToastrService,
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


  ngOnInit(): void {
    
    this.val = localStorage.getItem('x-access-token') ? true : false;

    if(this.val){
      this.authService.getUser().subscribe((res: HttpResponse<any>) => {
        // console.log(res);
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

          // console.log(res.body._id);
          this.permission = res.body.permission;
          this.username = res.body.username;
          this.email = res.body.email;
          this.id = res.body._id;
          this.dataSharingService.isUserLoggedIn.next(true);
          this.dataSharingService.username.next(res.body.username);
          
          this.displayImg(this.id);
          this.findUsers(this.id);

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
        // console.log(typeof this.users);
        // console.log(this.users);
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

  onEditClick(){
    this.authService.getOwnEditUser(this.id).subscribe((res: HttpResponse<any>) => {
      if(res.body.success){
        console.log(res);
        this.editid = res.body.user._id;
        this.editusername = res.body.user.username;
        this.editemail = res.body.user.email;
        this.editpermission = res.body.user.permission;
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
    // console.log(this.editname);
    this.authService.EditOwnUser(this.editid, this.editusername, this.editemail, this.editpermission).subscribe((res: HttpResponse<any>) => {
      if(res.body.success){
        this.toastr.success(res.body.message, 'Success');
        this.username = this.editusername;
        this.email = this.editemail;
        this.dataSharingService.username.next(this.username);
      } else{
        this.toastr.error(res.body.message, 'Failure');
      }      
    },
    (err: HttpErrorResponse) => {
      this.toastr.error(err.error.message, 'Failure');
    })
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

  preUpload(event){
    let file = event.target.files[0];
    if (event.target.files.length > 0){
    this.isFileChosen = true;
    }        
    this.filename = file.name;
  }

  avatarUpload(){
    const avatar = this.displayCode();
    console.log(avatar);
    this.authService.UploadImg(this.id, this.username, this.email, this.permission, avatar).subscribe((res: HttpResponse<any>) => {
      if(res.body.success){
        this.toastr.success(res.body.message, 'Success');
        // this.username = this.editusername;
        // this.email = this.editemail;
        this.dataSharingService.username.next(this.username);
        this.displayImg(this.id);
      } else{
        this.toastr.error(res.body.message, 'Failure');
        this.displayImg(this.id);
      }      
    },
    (err: HttpErrorResponse) => {
      this.toastr.error(err.error.message, 'Failure');
      this.displayImg(this.id);
    })
  }

}
