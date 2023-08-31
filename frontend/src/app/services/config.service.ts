import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Functions } from '@aed-app/shared/functions';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ConfigService {

    constructor(private auth:AuthService,private http: HttpClient,) { }

    
    getConfigs(): any {
        // if (!this.auth.isLoggedIn() || this.auth.userValue() == null) this.auth.logout();
        const user = this.auth.userValue()!;
        return this.http.post(`${Functions.backenUrl()}/configs`, {userId:user.id, dhisusersession: user.dhisusersession}, Functions.HttpHeaders(this.auth));
    }

    appVersion(): any {
        return this.http.post(`${Functions.backenUrl()}/configs/appVersion`, {getversion:true}, Functions.HttpHeaders(this.auth));
    }

    NewUserToken(): any {
        if (!this.auth.isLoggedIn() || this.auth.userValue() == null) this.auth.logout();
        const user = this.auth.userValue()!;
        return this.http.post(`${Functions.backenUrl()}/configs/newToken`, {userId:user.id, dhisusersession: user.dhisusersession},Functions.HttpHeaders(this.auth));
    }
      
} 