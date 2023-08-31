import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthsRoutingModule } from './auths-routing.module';
import { LoginComponent } from './login.component';
import { RegisterComponent } from './register.component';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AuthsRoutingModule
  ],
  declarations: [LoginComponent, RegisterComponent]
})
export class AuthsModule { }

