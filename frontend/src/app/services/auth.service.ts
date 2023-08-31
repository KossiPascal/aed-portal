import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Router } from "@angular/router";
import { User } from "@aed-models/User";
import moment from "moment";
import { Functions, notNull } from "@aed-app/shared/functions";
import { AppStorageService } from "./cookie.service";
import { Roles } from "../shared/roles";
import { Chws } from "../models/Sync";

Functions
@Injectable({
  providedIn: "root",
})
export class AuthService {

  constructor(private store:AppStorageService, private router: Router, private http: HttpClient) { }

  private roles = new Roles(this.store);

  public userValue(): User | null {
      try {
        if (notNull(this.store.get('user'))) {
          var userData: User = JSON.parse(this.store.get('user') ?? '');
          userData.userLogo = 'assets/images/default_icon.png';
          // if( typeof(your_variable) === 'string' ) { ... }
          return userData;
        };
      } catch (error) {
        
      }
      return null;
  }

  public tokenIsNotEmpty(): boolean {
    if (this.userValue() != null) {
      const token = this.userValue()!.token;
      return token != null && token != undefined && token != "" && token.length > 0;
    }

    return false;
  }

  public isLoggedIn(): boolean {
    if (this.getExpiration()) {
      return moment().isBefore(this.getExpiration());
    }
    return false;
  }

  isLoggedOut() {
    return !this.isLoggedIn();
  }

  getExpiration(): moment.Moment | null {
    if (this.userValue()) {
      const expiration = this.userValue()!.expiresIn;
      if (expiration) {
        const expiresAt = JSON.parse(expiration);
        return moment(expiresAt);
      }
    }
    return null;
  }

  getAllUsers(): any {
    // if (!this.isLoggedIn() || this.userValue() == null) this.logout();
    const user = this.userValue();
    const sendParams = { userId: user?.id, dhisusersession: user?.dhisusersession };

      return this.http.post(`${Functions.backenUrl()}/user/all`, sendParams, Functions.HttpHeaders(this));
  }

  getUserBy(id: string): any {
    if (!this.isLoggedIn() || this.userValue() == null) this.logout();
    const user = this.userValue();
    const sendParams = { userId: user?.id, dhisusersession: user?.dhisusersession };

      return this.http.post(`${Functions.backenUrl()}/user/${id}`, sendParams, Functions.HttpHeaders(this));
  }

  updateUser(user: User): any {
    if (!this.isLoggedIn() || this.userValue() == null) this.logout();
    const thisuser = this.userValue();
    const sendParams = { userId: thisuser?.id, dhisusersession: thisuser?.dhisusersession, user_to_update: user };

      return this.http.post(`${Functions.backenUrl()}/user/update`, sendParams, Functions.HttpHeaders(this));
  }


  deleteUser(user: User): any {
    if (!this.isLoggedIn() || this.userValue() == null) this.logout();
    const thisuser = this.userValue();
    const sendParams = { userId: thisuser?.id, dhisusersession: thisuser?.dhisusersession , user_to_delete: user};

    return this.http.post(`${Functions.backenUrl()}/user/delete`, sendParams, Functions.HttpHeaders(this));
  }

  alreadyLogin(redirecUrl?: string) {
    if (this.isLoggedIn()) location.href = redirecUrl??this.userValue()?.defaultRedirectUrl!;
  }



  register(user: User): any {
    const canProcide = !this.isLoggedIn() || this.roles.isSuperUser();
      return canProcide ? this.http.post(`${Functions.backenUrl()}/auth/register`, user, Functions.HttpHeaders(this)) : this.alreadyLogin();
  }

  login(username: string, password: string): any {
      const sendParams = { username: username, password: password };
      return !this.isLoggedIn() ? this.http.post(`${Functions.backenUrl()}/auth/login`, sendParams, Functions.HttpHeaders(this)) : this.alreadyLogin();
  }

  logout() {
    Functions.saveCurrentUrl(this.router);
    localStorage.removeItem("user");
    localStorage.removeItem("chw_found");
    localStorage.removeItem("IFrame");
    location.href = 'auths/login';
  }


  

  public chwsOrgUnit(): Chws|null {
    try {
      if (notNull(this.store.get('chw_found'))) {
        return JSON.parse(this.store.get('chw_found') ?? '') as Chws;
      };
    } catch (error) {
      
    }
    return null;
}

}
