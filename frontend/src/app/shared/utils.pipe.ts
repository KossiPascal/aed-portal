import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'utils',
  pure:false,
})
export class UtilsPipe implements PipeTransform {

  transform(value: string|undefined, ...args: string[]): string {
    let data: string = '';
    args.forEach((val) => {
      if (val == 'picture' && value!=undefined) {
          data = `https://assets.pokemon.com/assets/cms2/img/pokedex/detail/${value}.png`;
      }
    });
    return data;
  }
}
