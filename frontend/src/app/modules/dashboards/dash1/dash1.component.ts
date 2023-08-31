import { Component, OnInit } from '@angular/core';
import { AppStorageService } from '@aed-app/services/cookie.service';


@Component({
  selector: 'app-dash-1',
  templateUrl: './dash1.component.html',
})
export class Dash1Component implements OnInit {
  


  constructor(private store:AppStorageService) { }

  ngOnInit(): void {
    
  }

}
