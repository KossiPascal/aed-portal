import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ErrorComponent } from './error.component';
import { SetMetaTags } from '@aed-app/services/set-meta-tags.service';


function redirectTo(): string{
    // window.location.reload();
    // location.href = 'error/404';
  return '404';
}
export const routes:Routes = [
  { path: '', redirectTo:redirectTo(), pathMatch: 'full' },
  { path: ':code', component: ErrorComponent, data: {title: 'Error'}, canActivate:[SetMetaTags]},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ErrorsRoutingModule { }
