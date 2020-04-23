import { Component, OnInit } from '@angular/core';
import { DataSharingService } from 'src/app/services/data-sharing.service';
import { AuthService } from 'src/app/services/auth.service';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { FormGroup, FormBuilder, FormControl, FormGroupDirective, NgForm, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { OrderPipe } from 'ngx-order-pipe';

@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.css']
})
export class BlogComponent implements OnInit {

  isUserLoggedIn: boolean;
  val: boolean;
  username;

  isAdmin: boolean;
  isModerator: boolean;
  isGuest: boolean;
  avatarImg: object;

  users;

  formtitle = new FormControl('', [Validators.required]);
  formbody = new FormControl('', [Validators.required]);
  formcomment = new FormControl('', [Validators.required]);
  editformcomment = new FormControl('', [Validators.required]);

  newtitle: string;
  newbody: string;

  newcomment: string;
  editcomment: string;
  editcommentId: string;
  editCommentedAt;
  editcommentator;

  edittitle: string;
  editbody: string;
  editusername: string;
  editCreatedAt;
  editid: string;

  hasProfileImg: boolean;
  path;

  hasCommentatorProfileImg: boolean;
  commentatorImgpath;

  newPost: boolean = false;
  blogs;
  blogsAvailable: boolean;

  loading: boolean = true;

  currentDate;

  constructor(
    private dataSharingService: DataSharingService,
    private authService: AuthService,
    public sanitizer: DomSanitizer,
    private toastr: ToastrService,
    private orderPipe: OrderPipe
  ) { 
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
          this.username = res.body.username;
          this.dataSharingService.isUserLoggedIn.next(true);
          this.dataSharingService.username.next(res.body.username);
          this.displayImg(res.body._id);
          this.findUsers(res.body._id);
          this.GetBlogs();

          this.currentDate = new Date();

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

  getCommentatorimage(imageType, image){
    return this.sanitizer.bypassSecurityTrustResourceUrl('data:'+imageType+';base64,'+image.toString('base64'));
  }

  titleErrorMessage(){
    if (this.formtitle.hasError('required')) {
      return 'You must enter a title';
    } else {
      return '';
    }
  }

  bodyErrorMessage(){
    if (this.formbody.hasError('required')) {
      return 'You must enter a body';
    } else {
      return '';
    }
  }

  commentErrorMessage(){
    if (this.editformcomment.hasError('required')) {
      return 'You must enter a body';
    } else {
      return '';
    }
  }

  PostBlog(){
    this.authService.PostBlog(this.newtitle, this.newbody, this.username).subscribe((res: HttpResponse<any>) => {
      if(res.body.success){
        this.toastr.success(res.body.message, 'Success');
        document.getElementById('openBlog').click();
        this.GetBlogs();
      } else{
        this.toastr.error(res.body.message, 'Failure');
      }
    }, (err: HttpErrorResponse) => {
      console.log(err.error);
    })
  }

  UpdateBlog(){
    this.authService.UpdateBlog(this.editid, this.edittitle, this.editbody, this.editusername).subscribe((res: HttpResponse<any>) => {
      if(res.body.success){
        this.toastr.success(res.body.message, 'Success');
        document.getElementById('editBlog').click();
        this.GetBlogs();
      } else{
        this.toastr.error(res.body.message, 'Failure');
      }
    }, (err: HttpErrorResponse) => {
      console.log(err.error);
    })
  }

  GetBlogs(){
    this.authService.GetBlogs().subscribe((res: HttpResponse<any>) => {
      if(res.body.success){
        this.blogs = res.body.blogs;
        this.orderPipe.transform(this.blogs);
      } else{
        this.toastr.error(res.body.message, 'Failure');
      }
      if(this.blogs.length === 0){
        this.blogsAvailable = false;
      } else{
        this.blogsAvailable = true;
      }
    }, (err: HttpErrorResponse) => {
      console.log(err.error);
    })
  }

  EditBlog(id: string){
    this.authService.EditBlog(id).subscribe((res: HttpResponse<any>) => {
      if(res.body.success){
        this.edittitle = res.body.blog.title;
        this.editbody = res.body.blog.body;
        this.editusername = res.body.blog.createdBy;
        this.editCreatedAt = res.body.blog.createdAt;
        this.editid = res.body.blog._id;
      } else{
        this.toastr.error(res.body.message, 'Failure');
      }
    }, (err: HttpErrorResponse) => {
      console.log(err.error);
    })
  }

  DeleteClick(id: string){
    this.authService.EditBlog(id).subscribe((res: HttpResponse<any>) => {
      if(res.body.success){
        this.editid = res.body.blog._id;
        this.edittitle = res.body.blog.title;
        this.editbody = res.body.blog.body;
        this.editusername = res.body.blog.createdBy;
        this.editCreatedAt = res.body.blog.createdAt;
      } else{
        this.toastr.error(res.body.message, 'Failure');
      }
    }, (err: HttpErrorResponse) => {
      console.log(err.error);
    })
  }

  DeleteBlog(id: string){
    this.authService.DeleteBlog(id).subscribe((res: HttpResponse<any>) => {      
      if(res.body.success){
        this.toastr.success(res.body.message, 'Success');
        this.GetBlogs();
      } else{
        console.log(res.body.message);
      }      
    }, (err: HttpErrorResponse) => {
      console.log(err.error);
    })
  } 

  LikeBlog(id: string){
    this.authService.LikeBlog(id).subscribe((res: HttpResponse<any>) => {      
      if(res.body.success){
        this.toastr.success(res.body.message, 'Success');
        this.GetBlogs();
      } else{
        console.log(res.body.message);
      }      
    }, (err: HttpErrorResponse) => {
      console.log(err.error);
    })
  }

  DislikeBlog(id: string){
    this.authService.DislikeBlog(id).subscribe((res: HttpResponse<any>) => {      
      if(res.body.success){
        this.toastr.success(res.body.message, 'Success');
        this.GetBlogs();
      } else{
        console.log(res.body.message);
      }      
    }, (err: HttpErrorResponse) => {
      console.log(err.error);
    })
  }

  PostComment(id: string, comment: string){
    this.authService.PostComment(id, comment).subscribe((res: HttpResponse<any>) => {      
      if(res.body.success){
        this.toastr.success(res.body.message, 'Success');
        this.newcomment = '';
        this.GetBlogs();
      } else{
        console.log(res.body.message);
      }      
    }, (err: HttpErrorResponse) => {
      console.log(err.error);
    })

    // console.log(comment);
  }

  clearComment(){
    (<HTMLTextAreaElement>document.getElementById('comment')).value = '';
    this.newcomment = '';
  }

  GetEditComment(id: string, commentId: string){
    this.authService.GetEditComment(id, commentId).subscribe((res: HttpResponse<any>) => {
      if(res.body.success){
        this.editid = res.body.blog._id;
        this.editcomment = res.body.comment.comment;
        this.editcommentId = res.body.comment._id;
        this.editCommentedAt = res.body.comment.commentedAt;
        this.editcommentator = res.body.comment.commentator.username;
      } else{
        console.log(res.body.message);
        this.toastr.error(res.body.message, 'Failure');
      }
    }, (err: HttpErrorResponse) => {
      console.log(err.error);
    })
  }

  EditComment(id: string, comment: string, commentId: string){
    this.authService.EditComment(id, comment, commentId).subscribe((res: HttpResponse<any>) => {
      if(res.body.success){
        this.toastr.success(res.body.message, 'Success');
        document.getElementById('editComment').click();
        this.GetBlogs();
      } else{
        console.log(res.body.message);
        this.toastr.error(res.body.message, 'Failure');
      }
    }, (err: HttpErrorResponse) => {
      console.log(err.error);
    })
  }

  DeleteComment(id: string, commentId: string){
    this.authService.DeleteComment(id, commentId).subscribe((res: HttpResponse<any>) => {
      if(res.body.success){
        this.toastr.success(res.body.message, 'Success');
        this.GetBlogs();
      } else{
        console.log(res.body.message);
        this.toastr.error(res.body.message, 'Failure');
      }
    }, (err: HttpErrorResponse) => {
      console.log(err.error);
    })
  }

}
