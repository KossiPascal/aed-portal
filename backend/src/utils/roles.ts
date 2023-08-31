import { User } from "../entity/User"
 
export function Roles(user:User) {
//  var roles: string[]  =  JSON.parse(user.roles);
 var roles: string[]  = user.roles.split(',');
 var isSuperUser: boolean  = roles.includes('super_user');
 var isAdmin: boolean =  roles.includes('admin') || isSuperUser;
 var isManager: boolean = roles.includes('manager') || isSuperUser;
 var isChws : boolean = roles.includes('chw');
 var isGuest: boolean = roles.includes('guest');

  return {
    isSuperUser: isSuperUser,
    isAdmin: isAdmin,
    isManager: isManager,
    isChws: isChws,
    isGuest: isGuest,
  }
} 