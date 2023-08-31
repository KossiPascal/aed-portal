export class Consts {

  static APP_LOGO = this.getPort() == 3030 || this.getPort() == 3031 ? 'assets/logo/logo.png' : 'assets/logo/dev_logo.png';
  static APP_LOGO_1 = this.getPort() == 3030 || this.getPort() == 3031 ? 'assets/logo/logo1.png' : 'assets/logo/dev_logo1.png';

  static isProdEnv(){
    return true;
  }

  private static getPort(): number {
    if (location.port == '4200') {
      // const port = location.protocol === 'https:' ? envs.PORT_SECURED : envs.PORT;
      const isHttps:boolean = location.protocol === 'https:';
      const prodPort = isHttps ? 3030 : 3031;
      const devPort = isHttps ? 7070 : 7071;
      return Consts.isProdEnv() == true ? prodPort : devPort;
      // return environment.apiURL;
    } 
    return parseInt(location.port);
  }


  static home_actions_forms: string[] = [
    // `vaccination_followup`,
    `pcime_c_asc`,
    `pcime_c_referral`,
    `pcime_c_followup`,
    `usp_pcime_followup`,
    `malnutrition_followup`,
    `pregnancy_family_planning`,
    `delivery`,
    `prenatal_followup`,
    `postnatal_followup`,
    `newborn_followup`,
    `home_visit`,
    `death_report`,
    `women_emergency_followup`,
    `fp_followup_danger_sign_check`,
    `fp_follow_up_renewal`
  ];

  static vaccination_forms: string[] = [
    `vaccination`,
  ];

  static consultations_followup_forms: string[] = [
    `pcime_c_asc`,
    `pregnancy_family_planning`,
    `delivery`,
    `pcime_c_followup`,
    `usp_pcime_followup`,
    `pcime_c_referral`,
    `malnutrition_followup`,
    `prenatal_followup`,
    `postnatal_followup`,
    `newborn_followup`,
    `women_emergency_followup`,
    `fp_followup_danger_sign_check`,
    `fp_follow_up_renewal`
  ];

  static consultations_forms: string[] = [
    `pcime_c_asc`, 
    `pregnancy_family_planning`,
    `delivery`
  ];

  static mum_fp_forms: string[] = [
    `pregnancy_family_planning`,
    `delivery`,
    `prenatal_followup`,
    `postnatal_followup`,
    `women_emergency_followup`,
    `fp_followup_danger_sign_check`,
    `fp_follow_up_renewal`,
  ];

  static fp_forms: string[] = [
    `pregnancy_family_planning`,
    `fp_followup_danger_sign_check`,
    `fp_follow_up_renewal`,
  ];

  static mum_forms: string[] = [
    `pregnancy_family_planning`,
    `delivery`,
    `prenatal_followup`,
    `postnatal_followup`,
    `women_emergency_followup`,
  ];

  static followup_forms: string[] = [
    `pcime_c_followup`,
    `usp_pcime_followup`,
    `pcime_c_referral`,
    `malnutrition_followup`,
    `prenatal_followup`,
    `postnatal_followup`,
    `newborn_followup`,
    `women_emergency_followup`,
    `fp_followup_danger_sign_check`,
    `fp_follow_up_renewal`
  ];

  static child_forms: string[] = [
    `pcime_c_asc`,
    `pcime_c_followup`,
    `usp_pcime_followup`,
    `newborn_followup`,
    `pcime_c_referral`,
    `malnutrition_followup`
  ];

  static child_followup_forms: string[] = [
    `pcime_c_followup`,
    `usp_pcime_followup`,
    `newborn_followup`,
    `pcime_c_referral`,
    `malnutrition_followup`
  ];

  static allForms: string[] = [
    `vaccination_followup`,
    `pcime_c_asc`,
    `pcime_c_referral`,
    `pcime_c_followup`,
    `usp_pcime_followup`,
    `malnutrition_followup`,
    `pregnancy_family_planning`,
    `delivery`,
    `prenatal_followup`,
    `postnatal_followup`,
    `newborn_followup`,
    `home_visit`,
    `death_report`,
    `women_emergency_followup`,
    `fp_followup_danger_sign_check`,
    `fp_follow_up_renewal`
  ]
}


