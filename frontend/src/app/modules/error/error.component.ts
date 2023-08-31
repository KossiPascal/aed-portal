import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@aed-app/services/auth.service';
// declare var $:any;

const errors:any = {
  403: {
    title: 403,
    msg: 'L\'acces à cette page est interdite pour vous !',
    description: 'FORBIDDEN'
  },
  404: {
    title: 404,
    msg: 'Unfortunately we are having trouble loading the page you are looking for. Please wait a moment and try again or use action below.',
    description: 'PAGE NOT FOUND'
  },
  500: {
    title: 500,
    msg: 'The server encountered an internal error or misconfiguration and was unable to complete your request.',
    description: 'INTERNAL SERVER ERROR'
  }
};

@Component({
  templateUrl: './error.component.html'
})
export class ErrorComponent implements OnInit {
  error:any; 

  constructor(private route: ActivatedRoute, private router:Router, private auth:AuthService) { }

  ngOnInit() {
    this.error = errors[this.route.snapshot.params['code']] || errors['404'];
  }

  returnBack(){
    location.href = this.auth.userValue()?.defaultRedirectUrl ?? 'auths/login';
  //   this.router.navigate([this.auth.userValue()?.defaultRedirectUrl])
  // .then(() => {
  //   window.location.reload();
  // });
  }

}
