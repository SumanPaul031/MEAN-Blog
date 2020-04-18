import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { NgbCollapseModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, ReactiveFormsModule} from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ToastrModule } from 'ngx-toastr';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NgxPaginationModule } from 'ngx-pagination';
import { FilePondModule, registerPlugin } from 'ngx-filepond';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { HomeComponent } from './components/home/home.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { RegisterComponent } from './components/register/register.component';
import { AuthService } from './services/auth.service';
import { LoginComponent } from './components/login/login.component';
import { ProfileComponent } from './components/profile/profile.component';
import { LoginGuardService } from './services/login-guard.service';
import { AuthGuardService } from './services/auth-guard.service';
import { DataSharingService } from './services/data-sharing.service';
import { AuthInterceptorsService } from './services/auth-interceptors.service';
import { BlogComponent } from './components/blog/blog.component';
import { NewpasswordComponent } from './components/reset/newpassword/newpassword.component';
import { ActivateComponent } from './components/activation/activate/activate.component';
import { ManagementComponent } from './components/management/management.component';
import { PermissionGuardService } from './services/permission-guard.service';

import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import FilePondPluginFileEncode from 'filepond-plugin-file-encode';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import FilePondPluginImageResize from 'filepond-plugin-image-resize';

registerPlugin(FilePondPluginFileValidateType);
registerPlugin(FilePondPluginFileEncode);
registerPlugin(FilePondPluginImagePreview);
registerPlugin(FilePondPluginImageResize);

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    HomeComponent,
    DashboardComponent,
    RegisterComponent,
    LoginComponent,
    ProfileComponent,
    BlogComponent,
    NewpasswordComponent,
    ActivateComponent,
    ManagementComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgbCollapseModule,
    NgbModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    ToastrModule.forRoot({
      timeOut: 8000,
      progressBar: true,
      progressAnimation: 'increasing',
      preventDuplicates: true
    }),
    BrowserAnimationsModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    NgxPaginationModule,
    FilePondModule
  ],
  providers: [
    AuthService,
    LoginGuardService,
    AuthGuardService,
    DataSharingService,
    {provide: HTTP_INTERCEPTORS, useClass: AuthInterceptorsService, multi: true},
    PermissionGuardService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
