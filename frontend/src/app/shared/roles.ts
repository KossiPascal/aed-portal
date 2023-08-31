import { User } from '@aed-app/models/User';
import { AppStorageService } from '@aed-app/services/cookie.service';
import { notNull } from '@aed-app/shared/functions';

 
export class Roles {

  constructor(private store:AppStorageService){ }

  private userValue(): User | null {
    if (notNull(this.store.get('user'))) return JSON.parse(this.store.get('user') ?? '');
    return null;
  }

  getRoles = (): string[] => {
    const userValue = this.userValue();
    return userValue && notNull(userValue) ? userValue.roles : [];
  }


  isSuperUser = (): boolean => {
    return notNull(this.getRoles()) && this.getRoles().includes('super_user');
  }

  isAdmin = (): boolean => {
    if (notNull(this.getRoles())) {
      return this.getRoles().includes('admin') || this.isSuperUser();
    }
    return false;
  }

  isManager = (): boolean => {
    if (notNull(this.getRoles())) {
      return this.getRoles().includes('manager') || this.isSuperUser();
    }
    return false;
  }

  isChws = (): boolean => {
    if (notNull(this.getRoles())) {
      return this.getRoles().includes('chw');
    }
    return false;
  }

  isGuest = (): boolean => {
    if (notNull(this.getRoles())) {
      return this.getRoles().includes('guest');
    }
    return false;
  }
} 