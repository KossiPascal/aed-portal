import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from './shared/shared.module';

const routes: Routes = [
  { path: '', redirectTo: 'auths', pathMatch: 'full' },
  { path: 'auths', loadChildren: () => import('./modules/auth/auths.module').then(m => m.AuthsModule)},
  { path: 'dashboards', loadChildren: () => import('./modules/dashboards/dashs.module').then(m => m.DashbordsModule)},
  { path: 'users', loadChildren: () => import('./modules/user/users.module').then(m => m.UsersModule)},
  { path: 'error', loadChildren: () => import('./modules/error/errors.module').then(m => m.ErrorsModule)},
  
  { path: '**', redirectTo: 'error' },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule, 
    SharedModule,
    RouterModule.forRoot(routes, { useHash: false, relativeLinkResolution: 'legacy' })
  ],
  exports: [RouterModule],
  providers: []
})
export class AppRoutingModule { }
