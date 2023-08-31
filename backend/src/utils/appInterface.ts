
export interface Sync {
  id: any;
  start_date: string;
  end_date: string;
}




export interface CouchDbFetchData {
  viewName:string,
  startKey?: string[];
  endKey?: string[];
  descending?: boolean
}


export interface ChwUserParams {
  host:string,
  contact:string, 
  parent:string,
  new_parent:string
}




export interface UserValue {
  id: string
  token: string
  username: string
  fullname: string
  roles:any
  isActive:boolean
  expiresIn:any
}