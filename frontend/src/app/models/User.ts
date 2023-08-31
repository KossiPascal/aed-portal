export interface User {
  id: any
  username: string
  fullname: string
  email: string
  roles:string[]
  isActive: boolean
  isSuperAdmin?: boolean
  expiresIn?:any
  token?: string
  dhisusersession:string
  userLogo?:any
  defaultRedirectUrl:string
}


export interface Configs {
  id:any
  showRegisterPage:boolean
}

// export enum Role {
//   User = 'User',
//   Admin = 'Admin'
// }