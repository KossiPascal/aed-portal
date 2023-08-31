import { HttpClient } from "@angular/common/http";
import { Component, OnInit } from "@angular/core";
import { AbstractControl, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { Configs } from "@aed-app/models/User";
import { ConfigService } from "@aed-app/services/config.service";
import { AppStorageService } from "@aed-app/services/cookie.service";
import { Consts } from "@aed-app/shared/constantes";
import { Functions } from "@aed-app/shared/functions";
import { Roles } from "@aed-app/shared/roles";
import { AuthService } from "@aed-services/auth.service";


@Component({
  selector: "app-register",
  templateUrl: "./register.component.html",
})
export class RegisterComponent implements OnInit {
  authForm!: FormGroup;
  isLoginForm: boolean = false;
  message: string = 'Vous voulez vous enrégistrer';
  isLoading: boolean = false;
  LoadingMsg: string = "Loading...";

  APP_LOGO: string = Consts.APP_LOGO;

  passwordType:'password'|'text' = 'password';

  constructor(private store:AppStorageService, private auth: AuthService, private router: Router, private http: HttpClient, private conf:ConfigService) { }

  private roles = new Roles(this.store);

  ngOnInit(): void {
    this.getConfigs();
    this.authForm = this.createFormGroup();
  }

  showHidePassword(){
    this.passwordType = this.passwordType == 'password' ? 'text' : 'password';
  }

  getConfigs(){
      return this.conf.getConfigs()
      .subscribe((res: Configs) => {
        if (res.showRegisterPage !== true) {
          const redirectUrl = Functions.getSavedUrl();
          if (redirectUrl) {
            location.href = redirectUrl
          } else {
            this.router.navigate(["auths/login"]);
            // location.href = 'auths/login'
          }
          console.log(`you don't have permission !`);
        }
      }, (err: any) => {
          const redirectUrl = Functions.getSavedUrl();
          if (redirectUrl) {
            location.href = redirectUrl
          } else {
            this.router.navigate(["auths/login"]);
          }
          console.log(`you don't have permission !`);
      });
  }

  createFormGroup(): FormGroup {
    return new FormGroup({
      username: new FormControl("", [Validators.required, Validators.minLength(4)]),
      fullname: new FormControl("", [Validators.required, Validators.minLength(4)]),
      email: new FormControl("", [Validators.required, Validators.email]),
      password: new FormControl("", [Validators.required, Validators.minLength(8)]),
      passwordConfirm: new FormControl("", [Validators.required, Validators.minLength(8)]),
      agreeTermsOrRemenberMe: new FormControl(false, [Validators.required]),
    }, [this.MatchValidator('password', 'passwordConfirm'), this.AcceptThermeValidator('agreeTermsOrRemenberMe')]);
  }


  MatchValidator(source: string, target: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const sourceCtrl = control.get(source);
      const targetCtrl = control.get(target);
      return sourceCtrl && targetCtrl && sourceCtrl.value !== targetCtrl.value
        ? { mismatch: true }
        : null;
    };
  }

  AcceptThermeValidator(source: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const sourceCtrl = control.get(source);
      return sourceCtrl && sourceCtrl.value !== true
        ? { mismatch: true }
        : null;
    };
  }

  passwordMatchError() {
    return this.authForm.getError('password') && this.authForm.get('passwordConfirm')?.touched;
  }

  register(): any {
    if (!this.auth.isLoggedIn()) {
      this.isLoading = true;
      return this.auth.register(this.authForm.value)
        .subscribe((res: {status:number, data:any}) => {

          if (res.status === 200) {
            this.message = 'Registed successfully !'
            const redirectUrl = Functions.getSavedUrl();
            if (redirectUrl) {
              location.href = redirectUrl
            } else {
              this.router.navigate(["auths/login"]);
              // location.href = 'auths/login'
            }
          } else {
            this.message = res.data;
          }
          console.log(this.message);
          this.isLoading = false;
        }, (err: any) => {
          this.message = err.error;
          this.isLoading = false;
          console.log(this.message);
        });
      // console.log('Register User ' + JSON.stringify(user));
      // await custumRequest('post', this.http, this, `/auth/register`, user).then((res) => res).catch((err) => err);
    } else {
      this.auth.alreadyLogin();
    }
  }
}
