import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@aed-app/services/auth.service';
import { AppStorageService } from '@aed-app/services/cookie.service';
import { Consts } from '@aed-app/shared/constantes';
import { Functions, notNull } from '@aed-app/shared/functions';
import { Roles } from '@aed-app/shared/roles';
import { User } from '@aed-models/User';
// import usersDb from '@aed-databases/users.json'; 
declare var closeAppModal:any;
declare var showAppModal:any;

@Component({
  selector: 'app-user',
  templateUrl: `./user-list.component.html`,

})
export class UserComponent implements OnInit {
  activeSave() {
    throw new Error('Method not implemented.');
  }
  users$: User[] = [
    {id: 'any',
      username: 'string',
      fullname: 'string',
      email: 'string',
      roles:['1', '2', '3'],
      isActive: true,
      dhisusersession:'string',
      defaultRedirectUrl:'string'},
  ];

  roles$: string[] = [];

  userForm!: FormGroup;
  isLoginForm: boolean = false;
  isLoading: boolean = false;
  LoadingMsg: string = "Loading...";
  isEditMode: boolean = false;
  user!:User|null;
  message: string = '';

  APP_LOGO: string = Consts.APP_LOGO;

  constructor(private store: AppStorageService, private auth: AuthService, private router: Router) { 
    // if(!this.roles.isSuperUser()) location.href = this.auth.userValue()?.defaultRedirectUrl!;
  }

  private roles = new Roles(this.store);
  
  ngOnInit(): void {
    this.getUsers();
    this.userForm = this.createFormGroup();
  }

  getUsers() {
    this.auth.getAllUsers().subscribe((res: {status:number, data:any}) => {
      if (res.status === 200){
        this.users$ = [];
        const userfound:User[] = res.data;
        for (let i = 0; i < userfound.length; i++) {
          const user = userfound[i];
          // delete user.password;
          this.users$.push(user)
        }
      } else {
        console.log(res.data);
      }
    }, (err: any) => { console.log(err.error) });
    // const user: User[] = Array.isArray(usersDb) ? usersDb : [];
  }

  EditUser(user:User, modalId:string) {
    this.isEditMode = true;
    user.roles = (user.roles.toString().replace('[','').replace(']','')).split(',')
    this.userForm = this.createFormGroup(user);
    this.user = user;
    this.showModal(modalId);
  }

  SelectUserToDelete(user:User, modalId:string){
    this.user = user;
    this.showModal(modalId);
  }
 
  DeleteUser() {
    this.isEditMode = false;
    if (this.user) this.auth.deleteUser(this.user).subscribe((res: {status:number, data:any}) => {
      if (res.status === 200) {
        this.getUsers();
        this.user = null;
        this.isLoading = false;
      } else {
        this.message = res.data;
      }
      console.log(this.message);
    }, (err: any) => {
      this.message = err;
      this.isLoading = false;
      console.log(this.message);
    });
  }

  CreateUser(modalId:string) {
    this.showModal(modalId);
    this.isEditMode = false;
    this.userForm = this.createFormGroup();
    this.user = null;
  }


  createFormGroup(user?: User): FormGroup {
    return new FormGroup({
      username: new FormControl(user != null ? user.username : '', [Validators.required, Validators.minLength(4)]),
      fullname: new FormControl(user != null ? user.fullname : '', [Validators.required, Validators.minLength(4)]),
      // email: new FormControl(user != null ? user.email : '', [Validators.required, Validators.email]),
      password: new FormControl('', this.isEditMode ? [] : [Validators.required, Validators.minLength(8)]),
      passwordConfirm: new FormControl('', this.isEditMode ? [] : [Validators.required, Validators.minLength(8)]),
      roles: new FormControl(user != null ? user.roles : '', [Validators.required, Validators.minLength(1)]),
      isActive: new FormControl(user != null ? user.isActive : false),
      // isSuperAdmin: new FormControl(user != null ? user.isSuperAdmin : false)
      
    }, [this.MatchValidator('password', 'passwordConfirm')]);
  }
  passwordMatchError() {
    return this.userForm.getError('password') && this.userForm.get('passwordConfirm')?.touched;
  }


  

  showModal(modalId:string){
    showAppModal(modalId);
  }

  closeModal(modalId:string){
    closeAppModal(modalId);
  }

  MatchValidator(source: string, target: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const sourceCtrl = control.get(source);
      const targetCtrl = control.get(target);

      if (sourceCtrl && targetCtrl) {
        if (sourceCtrl.value !== targetCtrl.value) {
          return { mismatch: true };
        }
        if (this.isEditMode) {
          if (notNull(sourceCtrl.value) && sourceCtrl.value.length < 8 || notNull(targetCtrl.value) && targetCtrl.value.length < 8) {
            return { mismatch: true };
          }
        }
      }
      return null;
    };
  }


  register(modalId:string): any {
    if (this.auth.isLoggedIn()) {

      if (this.isEditMode) {
        const editPassword: boolean = notNull(this.userForm.value.password) && notNull(this.userForm.value.passwordConfirm);
        this.userForm.value['editPassword'] = editPassword;
        this.userForm.value['id'] = this.user!.id;
      }

      return (this.isEditMode ? this.auth.updateUser(this.userForm.value) : this.auth.register(this.userForm.value))
        .subscribe((res: {status:number, data:any}) => {

          if (res.status === 200) {
            this.message = 'Registed successfully !'
            // this.message = 'Registed successfully !'
            this.closeModal(modalId);
            console.log(`successfully !`);
            this.getUsers();
          } else {
            this.message = res.data;
          }
          console.log(this.message);   
          this.isLoading = false;
        }, (err: any) => {
          // this.message = err.error;
          this.isLoading = false;
          // console.log(this.message);
        });
    } else {
      this.auth.logout();
    }
  }

}