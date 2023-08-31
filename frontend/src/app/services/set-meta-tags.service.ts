import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { CanActivate, ActivatedRouteSnapshot, UrlTree, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Observable, filter, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SetMetaTags implements CanActivate {

    constructor(private titleService: Title, private router: Router, private activatedRoute: ActivatedRoute) { }
  
    canActivate(
      route: ActivatedRouteSnapshot
    ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
      const value = route.data?.['title'] || 'AED-portal';
      this.titleService.setTitle(value);
      return true;
    }

    setRouteTitle(){
        this.router
          .events.pipe(
            filter(event => event instanceof NavigationEnd),
            map(() => {
              const child = this.activatedRoute.firstChild;
              if (child) {
                if (child.snapshot.data['title']) {
                  return child.snapshot.data['title'];
                }
              }
            //   return appTitle;
            })
          ).subscribe((ttl: string) => {
            this.titleService.setTitle(ttl);
          });
    }
  
  }