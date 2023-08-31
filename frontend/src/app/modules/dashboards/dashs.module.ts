import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardsRoutingModule } from './dashs-routing.module';
import { ReactiveFormsModule } from '@angular/forms';
import { Dash1Component } from './dash1/dash1.component';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DashboardsRoutingModule
  ],
  declarations: [Dash1Component]
})
export class DashbordsModule { }

