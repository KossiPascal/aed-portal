import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from './login.component';
import { RegisterComponent } from './register.component';
import { SetMetaTags } from '@aed-app/services/set-meta-tags.service';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full'},
  { path: 'login', component: LoginComponent, data: {"title": "Login"}, canActivate:[SetMetaTags] },
  { path: 'register', component: RegisterComponent, data: {title: 'Register'}, canActivate:[SetMetaTags] },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthsRoutingModule { }
