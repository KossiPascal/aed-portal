import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { Router } from '@angular/router';
import { AuthService } from '@aed-services/auth.service';
import { HttpClient } from "@angular/common/http";
import { Configs, User } from '@aed-app/models/User';
import { Functions } from '@aed-app/shared/functions';
import { ConfigService } from '@aed-app/services/config.service';
import { AppStorageService } from '@aed-app/services/cookie.service';
import { Roles } from '@aed-app/shared/roles';
import { Consts } from '@aed-app/shared/constantes';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit {
  authForm!: FormGroup;
  isLoginForm: boolean = true;
  message: any = 'Vous êtes déconnecté !';
  isLoading:boolean = false;
  LoadingMsg: string = "Loading...";
  showRegisterPage:boolean = false;
  passwordType:'password'|'text' = 'password';


  APP_LOGO: string = Consts.APP_LOGO;


  constructor(private store:AppStorageService, private auth: AuthService, private conf:ConfigService) { }

  ngOnInit(): void {
    this.getConfigs;
    this.auth.alreadyLogin();
    this.authForm = this.createFormGroup();
  }

  getConfigs(){
    return this.conf.getConfigs()
    .subscribe((res: Configs) => {
      this.showRegisterPage = res.showRegisterPage ?? false;
    }, (err: any) => {
      this.showRegisterPage = false;
    });
  }

  

  showHidePassword(){
    this.passwordType = this.passwordType == 'password' ? 'text' : 'password';
  }

  setMessage(msg: string) {
      this.message = msg ? msg : 'Une Erreur est survenue';
    // this.message = this.auth.isLoggedIn$ ?
    // 'Vous êtes connecté.' : 'Identifiant ou mot de passe incorrect.';
  }


  // redirectTo: (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  //   return ['topics', route.data.topics[0]];
  // }

  createFormGroup(): FormGroup {
    return new FormGroup({
      username: new FormControl("", [
        Validators.required,
        Validators.minLength(3),
      ]),
      password: new FormControl("", [
        Validators.required,
        Validators.minLength(7),
      ]),
      agreeTermsOrRemenberMe: new FormControl(false, []),
    });
  }



  login(): any {
    if (!this.auth.isLoggedIn()) {
      this.isLoading = true;
      return this.auth.login(this.authForm.value.username, this.authForm.value.password)
        .subscribe((res: {status:number, data:User|string}) => {
          if (res.status === 200) {
            this.message = 'Login successfully !';
            this.store.set("user", JSON.stringify(res.data));
            // this.router.navigate([redirectUrl || this.auth.userValue()?.defaultRedirectUrl]);
            var roles = new Roles(this.store);

            if (roles.isChws()) {
              location.href = this.auth.userValue()?.defaultRedirectUrl!;
            } else {
              location.href = Functions.getSavedUrl() ?? this.auth.userValue()?.defaultRedirectUrl!;
            }
          } else {
            this.message = res.data;
            this.isLoading = false;
          }

        }, (err: any) => {
          this.isLoading = false;
          this.message = err;
          console.log(this.message);
        });
    } else {
      this.auth.alreadyLogin();
    }
  }

  passwordMatchError() {
    return false;
  }
}
