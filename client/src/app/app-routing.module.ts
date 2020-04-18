import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { RegisterComponent } from './components/register/register.component';
import { LoginComponent } from './components/login/login.component';
import { ProfileComponent } from './components/profile/profile.component';
import { AuthGuardService } from './services/auth-guard.service';
import { LoginGuardService } from './services/login-guard.service';
import { BlogComponent } from './components/blog/blog.component';
import { NewpasswordComponent } from './components/reset/newpassword/newpassword.component';
import { ActivateComponent } from './components/activation/activate/activate.component';
import { ManagementComponent } from './components/management/management.component';
import { PermissionGuardService } from './services/permission-guard.service';


const routes: Routes = [
  {path: '', pathMatch: 'full', redirectTo: 'home'},
  {path: 'home', component: HomeComponent},
  {path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuardService]},
  {path: 'register', component: RegisterComponent, canActivate: [LoginGuardService]},
  {path: 'login', component: LoginComponent, canActivate: [LoginGuardService]},
  {path: 'profile', component: ProfileComponent, canActivate: [AuthGuardService]},
  {path: 'blog', component: BlogComponent, canActivate: [AuthGuardService]},
  {path: 'newpassword/:token', component: NewpasswordComponent, canActivate: [LoginGuardService]},
  {path: 'activate/:token', component: ActivateComponent, canActivate: [LoginGuardService]},
  {path: 'management', component: ManagementComponent, canActivate: [PermissionGuardService]},
  {path: '**', redirectTo: 'home'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
