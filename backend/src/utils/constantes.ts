import path from "path";

export class Consts {
    private static projectFolderName = path.basename(path.dirname(path.dirname(path.dirname(__dirname))));

    static isProdEnv:boolean = this.projectFolderName === 'aed-portal' ;

    static death_form = [
        "death_report",
    ];

    static women_forms = [
        "pregnancy_register",
        "prenatal_followup",
        "postnatal_followup",
        "delivery"
    ];

  static defaultSecurePort: string  = '4004';
  static defaultPort: string  = '4000';
  static home_visit_form: any;
  static child_followup_forms: any;
  static pregnancy_pf_forms: any;



//   const prodPort = isHttps ? 3030 : 3031;
//   const devPort = isHttps ? 7070 : 7071;

}






