import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ErrorsRoutingModule } from './errors-routing.module';
import { ErrorComponent } from './error.component';


@NgModule({
  imports: [
    CommonModule,
    ErrorsRoutingModule
  ],
  declarations: [ErrorComponent]
})
export class ErrorsModule { }
