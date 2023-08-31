import { Injectable } from '@angular/core';


@Injectable({
    providedIn: "root",
})
export class AppStorageService {

    constructor() { }


    getDhis2AuthToken = (): string|null => sessionStorage.getItem('dhisusersession');

    setDhis2AuthToken = (value:string) => sessionStorage.setItem('dhisusersession', value);

    get = (name: string): string => localStorage.getItem(name) ?? '';

    set = (name: string, value: string)  => localStorage.setItem(name, value);

    delete = (name: string) => localStorage.removeItem(name);

    deleteAll = () => localStorage.clear();



    // check = (name: string): boolean => this.cookieService.check(name);

    // get = (name: string): string => this.cookieService.get(name);

    // getAll = (): { [key: string]: string } => this.cookieService.getAll();

    // set(name: string, value: string, expires?: number | Date | undefined, path?: string | undefined, domain?: string | undefined, secure?: boolean | undefined, sameSite?: SameSite | undefined) {
    //     this.cookieService.set(name, value, expires, path, domain, secure, sameSite);
    // }

    // delete(name: string, path?: string | undefined, domain?: string | undefined, secure?: boolean | undefined, sameSite?: SameSite | undefined) {
    //     this.cookieService.delete(name, path, domain, secure, sameSite);
    // }

    // deleteAll(path?: string | undefined, domain?: string | undefined, secure?: boolean | undefined, sameSite?: SameSite | undefined) {
    //     this.cookieService.deleteAll(path, domain, secure, sameSite);
    // }
}