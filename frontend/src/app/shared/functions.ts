import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Router } from "@angular/router";
import { Patients } from "@aed-app/models/Sync";
import { AuthService } from "@aed-services/auth.service";
import { Consts } from "./constantes";
// import { envs } from '@aed-backendEnv/env';
// const httpOptions: { headers: HttpHeaders } = {headers: new HttpHeaders({ "Content-Type": "application/json" }),};

export function notNull(data: any): boolean {
  return data != '' && data != null && data != undefined && typeof data != undefined && data.length != 0; // && Object.keys(data).length != 0;
}

export class Functions {

  static LatLonToMercator(lat: number, lon: number): { x: number, y: number } {
    var rMajor = 6378137; //Equatorial Radius, WGS84
    var shift = Math.PI * rMajor;
    var x = lon * shift / 180;
    var y = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180);
    y = y * shift / 180;
    return { x: x, y: y };
  }

  static getXYforLatLng(lat: number, lon: number, zoom?: number): { x: number, y: number } {
    //max zoom = 22 
    var zooom = notNull(zoom) ? zoom! : 22;
    var x = Math.floor((lon + 180) / 360 * Math.pow(2, zooom));
    var y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zooom));
    return { x: x, y: y };
  }

  static MercatorToLatLon(x: number, y: number): { lat: number, lon: number } {

    var rMajor = 6378137; //Equatorial Radius, WGS84
    var shift = Math.PI * rMajor;
    var lon = x / shift * 180.0;
    var lat = y / shift * 180.0;
    lat = 180 / Math.PI * (2 * Math.atan(Math.exp(lat * Math.PI / 180.0)) - Math.PI / 2.0);

    return { lat: lat, lon: lon };
  }

  static degrees2meters(lat: number, lon: number): { x: number, y: number } {
    var x = lon * 20037508.34 / 180;
    var y = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180);
    y = y * 20037508.34 / 180;
    return { x: x, y: y };
  }


  static meters2degress(x: number, y: number): { lat: number, lon: number } {
    var lon = x * 180 / 20037508.34;
    //thanks magichim @ github for the correction
    var lat = Math.atan(Math.exp(y * Math.PI / 20037508.34)) * 360 / Math.PI - 90;
    return { lat: lat, lon: lon };
  }



  static convertLatLonToXY(data: { lat: number, lon: number, map_width?: number, map_height?: number }): { x: number, y: number } {

    var MAP_WIDTH = notNull(data.map_width) ? data.map_width! : 1000;
    var MAP_HEIGHT = notNull(data.map_height) ? data.map_height! : 446;

    var y = ((-1 * data.lat) + 90) * (MAP_HEIGHT / 180);
    var x = (data.lon + 180) * (MAP_WIDTH / 360);
    return { x: x, y: y };
  }

  static range(size: number, startAt: number = 0) {
    return [...Array(size).keys()].map(i => i + startAt);
  }

  static returnEmptyArrayIfNul(data: any): string[] {
    return notNull(data) ? data : [];
  }

  static returnDataAsArray(data: any): string[] {
    return notNull(data) ? [data] : [];
  }

  static convertToArray(data: any): string[] {
    return notNull(data) ? [data] : [];
  }

  static saveCurrentUrl(router: Router): void {
    const link = router.url.split(Functions.backenUrl(''))[0];
    // const link = location.href;
    // const link = window.location.href;
    sessionStorage.setItem("redirect_url", link);
  }

  static getSavedUrl(): string | null {
    const link = sessionStorage.getItem('redirect_url');
    sessionStorage.removeItem("redirect_url");
    return link;
  }

  static loadCssScripts(dynamicCssScripts: string[]) {
    for (let i = 0; i < dynamicCssScripts.length; i++) {
      const src = dynamicCssScripts[i];
      const ext = src.slice(src.length - 3);

      if (ext === 'css') {
        let link = document.createElement("link");
        link.rel = "stylesheet";
        link.type = "text/css";
        link.id = "theme";
        link.href = src;
        document.getElementsByTagName('head')[0].appendChild(link);
      }

      if (ext === '.js') {
        const script = document.createElement('script');
        script.src = src;
        script.type = 'text/javascript';
        script.async = true;
        script.charset = 'utf-8';
        document.getElementsByTagName('head')[0].appendChild(script);
      }
    }
  }




  static capitaliseDataGiven(str: any, inputSeparator: string = ' ', outPutSeparator: string = ' '): string {
    const arr = str.toString().split(inputSeparator);
    //loop through each element of the array and capitalize the first letter.
    for (var i = 0; i < arr.length; i++) {
      arr[i] = arr[i].charAt(0).toUpperCase() + arr[i].slice(1);
    }
    //Join all the elements of the array back into a string 
    //using a blankspace as a separator 
    const str2 = arr.join(" ");
    return str2;

  }

  static backenUrl(cible: string = 'api'): string {
    if (location.port == '4200') {
      // const port = location.protocol === 'https:' ? envs.PORT_SECURED : envs.PORT;
      const isHttps: boolean = location.protocol === 'https:';
      const prodPort = isHttps ? 3030 : 3031;
      const devPort = isHttps ? 7070 : 7071;
      const port = Consts.isProdEnv() ? prodPort : devPort;
      return `${location.protocol}//${location.hostname}:${port}/${cible}`;
      // return environment.apiURL;
    }
    return `${location.origin}/${cible}`;
  }

  static custumRequest(method: string, http: HttpClient, auth: AuthService, url: string, data?: any, responseType?: any) {
    // console.log(`${baseUrl}/${url}`);
    // console.log('request ' + JSON.stringify(data));
    const result = http.request(method, url, {
      body: data,
      responseType: responseType || 'json',
      observe: 'body',
      headers: {
        Authorization: auth.userValue() != null ? `Bearer ${auth.userValue()!.token}` : '',
        "Content-Type": "application/json"
      }
    });

    return new Promise<any>((resolve, reject) => {
      result.subscribe(resolve, reject);
    });
  }


  static HttpHeaders(auth: AuthService): { headers: HttpHeaders } {
    return {
      headers: new HttpHeaders({
        Authorization: auth.userValue() != null ? `Bearer ${auth.userValue()!.token}` : ''
        // "Content-Type": "application/json" 
      }),
    };
  }

  static isNumber(n: any): boolean {
    return /^-?[\d.]+(?:e-?\d+)?$/.test(n);
  }
}


export function patientAgeDetails(patient: Patients): {
  is_in_cible: boolean,
  is_child_in_cible: boolean,
  is_female_in_cible: boolean
  age_in_year: number | null,
  age_in_month: number | null,
  age_in_day: number | null,
} {
  const is_child_in_cible = DateUtils.isChildUnder5(patient.date_of_birth!);
  const is_female_in_cible = DateUtils.isFemaleInCible({ birth_date: patient.date_of_birth!, sex: patient.sex! });
  const is_in_cible = is_child_in_cible || is_female_in_cible;
  const age_in_year = DateUtils.getAgeInYear(patient.date_of_birth!);
  const age_in_month = DateUtils.getAgeInMonths(patient.date_of_birth!);
  const age_in_day = DateUtils.getAgeInDays(patient.date_of_birth!);

  return { is_in_cible: is_in_cible, is_child_in_cible: is_child_in_cible, is_female_in_cible: is_female_in_cible, age_in_year: age_in_year, age_in_month: age_in_month, age_in_day: age_in_day }

}


export class DateUtils {

  static getAgeInMilliseconds(birth_date?: string) {
    if (birth_date != null) {
      return new Date(Date.now() - (new Date(birth_date)).getTime());
    }
    return null;
  }

  static getAgeInYear(birth_date: string, withUtc: boolean = true) {
    var ageInMs = DateUtils.getAgeInMilliseconds(birth_date);
    if (ageInMs != null) {
      const year = withUtc ? ageInMs.getUTCFullYear() : ageInMs.getFullYear();
      return Math.abs(year - 1970);
      // return Math.round(ageInMs.getTime() / (1000 * 60 * 60 * 24 *365));
    }
    return null;
  }

  static getAgeInMonths(birth_date: string, round: boolean = false) {
    var ageInMs = DateUtils.getAgeInMilliseconds(birth_date);
    if (ageInMs != null) {
      const ageInMonth = ageInMs.getTime() / (1000 * 60 * 60 * 24 * 30);
      return round ? Math.round(ageInMonth) : ageInMonth;
    }
    return null;
  }
  static getAgeInDays(birth_date: string) {
    var ageInMs = DateUtils.getAgeInMilliseconds(birth_date);
    if (ageInMs != null) {
      return ageInMs.getTime() / (1000 * 60 * 60 * 24);
    }
    return null;
  }

  static isChildUnder5(birth_date: string): boolean {
    var childAge = DateUtils.getAgeInMonths(birth_date);
    if (childAge != null) {
      return childAge < 60;
    }
    return false;
  }

  static isFemaleInCible(data: { birth_date: string, sex: string }) {
    const year = DateUtils.getAgeInYear(data.birth_date!);
    if (year != null) return year >= 5 && year < 60 && data.sex == 'F';
    return false;
  }

  static isInCible(data: { birth_date: string, sex: string }): boolean {
    return DateUtils.isChildUnder5(data.birth_date) || DateUtils.isFemaleInCible(data);
  }

  static isGreater(d1: any, d2: any): boolean {
    try {
      let date1 = d1 instanceof Date ? d1.getTime() : new Date(d1).getTime();
      let date2 = d2 instanceof Date ? d2.getTime() : new Date(d2).getTime()
      if (date1 > date2) return true;
    } catch (error) {

    }
    return false;
  }
  static isGreaterOrEqual(d1: any, d2: any): boolean {
    try {
      let date1 = d1 instanceof Date ? d1.getTime() : new Date(d1).getTime();
      let date2 = d2 instanceof Date ? d2.getTime() : new Date(d2).getTime()
      if (date1 >= date2) return true;
    } catch (error) {

    }
    return false;
  }

  static isLess(d1: any, d2: any): boolean {
    try {
      let date1 = d1 instanceof Date ? d1.getTime() : new Date(d1).getTime();
      let date2 = d2 instanceof Date ? d2.getTime() : new Date(d2).getTime()
      if (date1 < date2) return true;
    } catch (error) {

    }
    return false;
  }

  static isLessOrEqual(d1: any, d2: any): boolean {
    try {
      let date1 = d1 instanceof Date ? d1.getTime() : new Date(d1).getTime();
      let date2 = d2 instanceof Date ? d2.getTime() : new Date(d2).getTime()
      if (date1 <= date2) return true;
    } catch (error) {

    }
    return false;
  }

  static isEqual(d1: any, d2: any): boolean {
    try {
      let date1 = d1 instanceof Date ? d1.getTime() : new Date(d1).getTime();
      let date2 = d2 instanceof Date ? d2.getTime() : new Date(d2).getTime()
      if (date1 == date2) return true;
    } catch (error) {

    }
    return false;
  }

  static isBetween(start: string, dateToCompare: string, end: string): boolean {
    if (DateUtils.isGreaterOrEqual(dateToCompare, start) && DateUtils.isLessOrEqual(dateToCompare, end)) return true;
    return false;
  }

  static getDateInFormat(dateObj: any, day: number = 0, format: string = `en`, withHour: boolean = false): string {
    var now: Date = dateObj instanceof Date ? dateObj : new Date(dateObj);

    var m = String(now.getMonth() + 1).padStart(2, '0');
    var d = String(day !== 0 ? day : now.getDate()).padStart(2, '0');
    var y = now.getFullYear();
    var h = now.getHours();
    var mm = String(now.getMinutes()).padStart(2, '0');
    var s = String(now.getSeconds()).padStart(2, '0');
    if (withHour === true) {
      if (format === `fr`) return `${d}/${m}/${y} ${h}:${mm}:${s}`;
      return `${y}-${m}-${d} ${h}:${mm}:${s}`;
    } else {
      if (format === `fr`) return `${d}/${m}/${y}`;
      return `${y}-${m}-${d}`;
    }
  }

  static previousDate(dateObj: any): Date {
    var now: Date = dateObj instanceof Date ? dateObj : new Date(dateObj);

    var y = now.getFullYear();
    var m = String(now.getMonth()).padStart(2, '0');
    var d = String(now.getDate()).padStart(2, '0');
    var h = String(now.getHours()).padStart(2, '0');
    var mm = String(now.getMinutes()).padStart(2, '0');
    var s = String(now.getSeconds()).padStart(2, '0');

    if (m == '00') {
      return new Date(`${y - 1}-12-${d} ${h}:${mm}:${s}`);
    } else {
      return new Date(`${y}-${m}-${d} ${h}:${mm}:${s}`);
    }

  }

  static startEnd21and20Date(): { start_date: string, end_date: string } {
    const now = new Date();

    var prev: string, end: string;
    if (now.getDate() < 21) {
      prev = DateUtils.getDateInFormat(DateUtils.previousDate(now), 21);
      end = DateUtils.getDateInFormat(now, 20);
    } else {
      prev = DateUtils.getDateInFormat(now, 21);
      end = DateUtils.getDateInFormat(now, parseInt(DateUtils.lastDayOfMonth(now)));
    }
    return { start_date: prev, end_date: end };
  }

  static lastDayOfMonth(dateObj: any): string {
    var date: Date = dateObj instanceof Date ? dateObj : new Date(dateObj);
    var d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return String(d.getDate()).padStart(2, '0');
  }


  static daysDiff(d1: any, d2: any): number {
    try {
      let date1 = d1 instanceof Date ? d1.getTime() : new Date(d1).getTime();
      let date2 = d2 instanceof Date ? d2.getTime() : new Date(d2).getTime()
      let difference = date1 - date2;
      let TotalDays = Math.ceil(difference / (1000 * 3600 * 24));
      return TotalDays < 0 ? -1 * TotalDays : TotalDays;
    } catch (error) {

    }
    return 0;
  }

  static isDayInDate(date: any, day: any): boolean {
    var d: string = String((date instanceof Date ? date : new Date(date)).getDate()).padStart(2, '0');

    return d == `${day}`;
  }

  static isBetween21and20(date: string): boolean {
    var betweenDate = DateUtils.startEnd21and20Date();
    return DateUtils.isGreaterOrEqual(date, betweenDate.start_date) && DateUtils.isLessOrEqual(date, betweenDate.end_date)
  }

  static getMondays(dateObj: any, format: string = `en`, withHour: boolean = false): string[] {
    var d = dateObj instanceof Date ? dateObj : new Date(dateObj);
    var month = d.getMonth();
    var mondays = [];
    d.setDate(1);
    // Get the first Monday in the month
    while (d.getDay() !== 1) {
      d.setDate(d.getDate() + 1);
    }
    // Get all the other Mondays in the month
    while (d.getMonth() === month) {
      const dt: Date = new Date(d.getTime());
      mondays.push(DateUtils.getDateInFormat(dt, 0, format, withHour));
      d.setDate(d.getDate() + 7);
    }
    return mondays;
  }
}
