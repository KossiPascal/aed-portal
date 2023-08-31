import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SetMetaTags } from '@aed-app/services/set-meta-tags.service';
import { Dash1Component } from './dash1/dash1.component';

const routes: Routes = [
  { path: '', redirectTo: 'dash1', pathMatch: 'full'},
  { path: 'dash1', component: Dash1Component, data: {"title": "Dashboard"}, canActivate:[SetMetaTags] },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardsRoutingModule { }
