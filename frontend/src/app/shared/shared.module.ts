import { NgModule } from '@angular/core';
import { UtilsPipe } from './utils.pipe';

@NgModule({
  declarations: [UtilsPipe],
  exports: [UtilsPipe,]
})
export class SharedModule { }
