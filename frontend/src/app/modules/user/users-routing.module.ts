import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { UserComponent } from './user-list.component';

const routes: Routes = [
  {
    path: '', component: UserComponent,
    data: {href: "user",icon: "fa fa-user",label: "Users", title: 'Users'},
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UsersRoutingModule { }
