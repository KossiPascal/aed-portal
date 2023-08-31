import { Component, HostBinding, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { SwUpdate } from '@angular/service-worker';
import { Subscription, interval, takeWhile } from 'rxjs';
import { AuthService } from './services/auth.service';
import { AppStorageService } from './services/cookie.service';
import { Roles } from './shared/roles';
import { Chws } from './models/Sync';
import { User } from './models/User';
import { Consts } from './shared/constantes';
import { ConfigService } from './services/config.service';

declare var $: any;

@Component({
  selector: 'app-root',
  templateUrl: `./app.component.html`,
  styleUrls: [`./app.component.css`]
})
export class AppComponent implements OnInit {
  isAuthenticated!: boolean;
  errorFound!: boolean;
  updateCheckText = '';
  isOnline!: boolean;
  modalVersion!: boolean;
  modalPwaEvent!: any;
  modalPwaPlatform: 'ios' | 'android' | undefined;
  private readonly retryFailedUpdateAfterSec = 5 * 60;
  private existingUpdateLoop?: any;

  appLogo: any = Consts.APP_LOGO_1
  userData: User | null = this.auth.userValue()
  chwOU: Chws | null = null;
  checkForAppNewVersion: boolean = true;

  separation: string = '_____________________________________';
  
  @HostBinding('attr.app-version')
  appVersion: any;
  updateSubscription?: Subscription;

  constructor(private titleService: Title, private store: AppStorageService, private conf: ConfigService, private auth: AuthService, private sw: SwUpdate) {
    this.isAuthenticated = true ;//this.auth.isLoggedIn();
    this.isOnline = false;
    this.modalVersion = false;
  }

  public roles = new Roles(this.store);


  ngOnInit(): void {
    this.UpdateVersion(false);
    const appTitle = this.titleService.getTitle();
    this.checkForAppNewVersion = true;

    this.getMsg('offlinemsg');
    this.errorFound = window.location.pathname.includes('error/');
    this.isAuthenticated = true ;//this.auth.isLoggedIn();

    this.updateOnlineStatus();
    window.addEventListener('online', this.updateOnlineStatus.bind(this));
    window.addEventListener('offline', this.updateOnlineStatus.bind(this));
    // this.checkForUpdates();
    // this.versionUpdateChecker();
    this.updateChecker();
    this.appVersion = localStorage.getItem('appVersion');
  }


  versionUpdateChecker() {
    // This avoids multiple updates retrying in parallel
    if (this.existingUpdateLoop) {
      clearTimeout(this.existingUpdateLoop);
      this.existingUpdateLoop = undefined;
    }

    window.navigator.serviceWorker.getRegistrations()
      .then((registrations) => {
        const registration = registrations && registrations.length && registrations[0];
        if (!registration) {
          console.warn('Cannot update service worker - no active workers found');
          return;
        }

        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker != null) {
            installingWorker.onstatechange = () => {
              switch (installingWorker.state) {
                case 'activated':
                  registration.onupdatefound = null;
                  this.ShowUpdateVersionModal();
                  break;
                case 'redundant':
                  console.warn(
                    'Service worker failed to install or marked as redundant. ' +
                    `Retrying install in ${this.retryFailedUpdateAfterSec}secs.`
                  );
                  this.existingUpdateLoop = setTimeout(() => this.versionUpdateChecker(), this.retryFailedUpdateAfterSec * 1000);
                  registration.onupdatefound = null;
                  break;
                default:
                  console.debug(`Service worker state changed to ${installingWorker.state}!`);
              }
            };
          }
        };

        registration.update();
      });
  }



  updateChecker() {
    if (this.sw.isEnabled) {
      this.sw.available.subscribe(() => {
        // if (confirm("New version available. Load New Version?")) window.location.reload();
        this.ShowUpdateVersionModal();
      });
    }
  }


  async checkForUpdates() {
    console.log('Service Worker is Enable: ', this.sw.isEnabled);
    if (this.sw.isEnabled && this.auth.isLoggedIn() && this.checkForAppNewVersion) this.checkForAvailableVersion();
    interval(30000)
      .pipe(takeWhile(() => this.sw.isEnabled && this.auth.isLoggedIn() && this.checkForAppNewVersion))
      .subscribe(() => {
        this.sw.checkForUpdate().then((updateFound) => {
          if (updateFound) this.checkForAvailableVersion();
        });
      });
  }

  private checkForAvailableVersion(): void {
    this.sw.activateUpdate().then((activate) => {
      if (activate) {
        this.sw.versionUpdates.subscribe(evt => {
          switch (evt.type) {
            case 'VERSION_DETECTED':
              // console.log(`Downloading new app version: ${evt.version.hash}`);
              this.ShowUpdateVersionModal();
              break;
            case 'VERSION_READY':
              // console.log(`Current app version: ${evt.currentVersion.hash}`);
              // console.log(`Last app version: ${evt.latestVersion.hash}`);
              break;
            case 'NO_NEW_VERSION_DETECTED':
              // console.log(`Current app version: '${evt.version.hash}'`);
              break;
            case 'VERSION_INSTALLATION_FAILED':
              // console.log(`Failed to install app version '${evt.version.hash}': ${evt.error}`);
              break;
          }
        });
      } else {
        // console.log('Service Worker for Update is Inactive');
      }
    });
  }

  clickModal(btnId: string) {
    $('#' + btnId).trigger('click');
  }

  

  ShowUpdateVersionModal() {
    this.checkForAppNewVersion = false;
    this.clickModal('active-update-modal')
  }

  UpdateVersion(reload: boolean = true) {
    this.conf.appVersion().subscribe((newVersion: any) => {
      if (reload) this.ShowUpdateVersionModal()
      localStorage.setItem('appVersion', newVersion);
      this.appVersion = newVersion;
      if (reload) this.clickModal('close-update-modal');
      if (reload) window.location.reload();
    }, (err: any) => { console.log(err.toString()) });
  }


  appVersionExist(): boolean {
    var nullField: any[] = [undefined, 'undefined', null, 'null', ''];
    return !nullField.includes(this.appVersion);
  }

  private updateOnlineStatus(): void {
    this.isOnline = window.navigator.onLine;
    console.info(`isOnline=[${this.isOnline}]`);
  }

  public closeVersion(): void {
    this.modalVersion = false;
  }



  public addToHomeScreen(): void {
    this.modalPwaEvent.prompt();
    this.modalPwaPlatform = undefined;
  }

  public closePwa(): void {
    this.modalPwaPlatform = undefined;
  }

  logout() {
    this.auth.logout();
  }


  // function msg
  getMsg(msgClass: string) {
    let element = document.querySelector('.' + msgClass)!;
    if (element != null) {
      element.className += " movedown";
      setTimeout(() => {
        element.classList.forEach(classname => {
          classname == "movedown" ? undefined : element.classList.remove('movedown');
        })
      }, 4000);
    }
  }


  pageTouched(event: Event) {
    const d1 = this.auth.getExpiration()?.toDate();
    const d2 = new Date();
    if (d1) {
      const d11 = d1.getTime();
      const d22 = d2.getTime();
      if ((d11 - 300000) < d22) { // avant 5 min d'action
        this.conf.NewUserToken().subscribe((res: any) => {
          this.store.set("user", JSON.stringify(res.data));
        }, (err: any) => { console.log(err.error) });
      }
    }
  }
}
