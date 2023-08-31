import { NextFunction, Request, Response } from "express";
import { validationResult } from 'express-validator';
import { Between, In } from "typeorm";
import { getChwsDataSyncRepository, ChwsData, Chws, getChwsSyncRepository, getPatientSyncRepository, Patients } from "../entity/Sync";
import { Consts } from "../utils/constantes";
import { DateUtils, notEmpty } from "../utils/functions";
import { getChws } from "./orgUnitsFromDB ";

const request = require('request');
// const fetch = require('node-fetch');

export async function getChwsDataWithParams(req: Request, res: Response, next: NextFunction, onlyData: boolean = false): Promise<any> {
  var respData: { status: number, data: any };
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    respData = { status: 201, data: 'Informations you provided are not valid' }
    return onlyData ? respData : res.status(201).json(respData);
  }
  const errorMsg: string = "Your request provides was rejected !";
  try {
    const repository = await getChwsDataSyncRepository();

    var allSync: ChwsData[] = await repository.find({
      where: {
        id: notEmpty(req.body.id) ? req.body.id : notEmpty(req.params.id) ? req.params.id : undefined,
        reported_date: notEmpty(req.body.start_date) && notEmpty(req.body.end_date) ? Between(req.body.start_date, req.body.end_date) : undefined,
        form: notEmpty(req.body.forms) ? In(req.body.forms) : undefined,
        source: notEmpty(req.body.sources) ? In(req.body.sources) : undefined,
        site: notEmpty(req.body.sites) ? { id: In(req.body.sites) } : undefined,
        zone: notEmpty(req.body.zones) ? { id: In(req.body.zones) } : undefined,
        chw: notEmpty(req.body.chws) ? { id: In(req.body.chws) } : undefined
      }
    });
    respData = !allSync ? { status: 201, data: 'Not data found with parametter!' } : { status: 200, data: allSync }
  }
  catch (err) {
    // return next(err);
    respData = { status: 201, data: errorMsg };
  }
  return onlyData ? respData : res.status(respData.status).json(respData);
}

function getChwInfos(chw: Chws[], chwId: string): Chws | null {
  if (notEmpty(chwId)) {
    for (let i = 0; i < chw.length; i++) {
      const asc: Chws = chw[i];
      if (asc != null && asc != undefined && asc.id === chwId) return asc;
    }
  }
  return null;
}

export async function getDataInformations(req: Request, res: Response, next: NextFunction): Promise<any> {
  var respData: { status: number, data: any };
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    respData = { status: 201, data: 'Informations you provided are not valid' }
    return res.status(201).json(respData);
  }

  const errorMsg: string = "Your request provides was rejected !";
  try {
    const dataWithParams: { status: number, data: any } = await getChwsDataWithParams(req, res, next, true);
    if (dataWithParams.status == 200) {
      const personRepo = await getPatientSyncRepository();
      var patients: Patients[] = await personRepo.find({
        where: {
          site: notEmpty(req.body.sites) ? { id: In(req.body.sites) } : undefined,
          zone: {
            id: notEmpty(req.body.zones) ? In(req.body.zones) : undefined,
          },
        }
      });

      const _chwsRepo = await getChwsSyncRepository();
      var chws: Chws[] = await _chwsRepo.find({
        where: {
          site: notEmpty(req.body.sites) ? { id: In(req.body.sites) } : undefined,
          zone: {
            id: notEmpty(req.body.zones) ? In(req.body.zones) : undefined,
          },
        }
      });

      if (!patients) return res.status(201).json({ status: 201, data: 'Not data found with parametter!' });

      var finalData: any = { total_visited: 0, total_not_visited: 0, family_count: 0, detail: [] };
      var patientsInfos: any = {};

      for (let f = 0; f < patients.length; f++) {
        const patient = patients[f];
        patientsInfos[`${patient.id}`] = { patient: patient, chw: getChwInfos(chws, patient.zone?.chw_id!), 
          data: { all_visit: 0, visit_in_day: 0, death: 0, child_visit: 0, women_visit: 0, home_visit: 0, isVisited: false } };

      }

      const chwsData: ChwsData[] = dataWithParams.data;
      var hasVisit: string[] = [];

      for (let d = 0; d < chwsData.length; d++) {
        const data = chwsData[d];
        if (data.family_id != null && data.family_id != undefined && data.family_id != "" && data.form != undefined && data.form != null) {
          var found = `${DateUtils.getDateInFormat(data.reported_date)}-${data.family_id}`;

          try {
            if (!hasVisit.includes(found)) {
              hasVisit.push(found);
              patientsInfos[data.family_id].data.visit_in_day += 1;
            }
            patientsInfos[data.family_id].data.all_visit += 1;
            if (patientsInfos[data.family_id].data.all_visit > 0) patientsInfos[data.family_id].data.isVisited = true;
            if (data.form == "death_report") patientsInfos[data.family_id].data.death += 1;
            if (data.form == "home_visit") patientsInfos[data.family_id].data.home_visit += 1;
            // if (Consts.child_forms.includes(data.form)) patientsInfos[data.family_id].data.child_visit += 1;
            if (Consts.women_forms.includes(data.form)) patientsInfos[data.family_id].data.women_visit += 1;

          } catch (error) {

          }
        }
      }

      const details = Object.values(patientsInfos);

      for (let d = 0; d < details.length; d++) {
        const dtl:any = details[d];
        finalData.family_count+=1;
        if(dtl.data.isVisited == true){
          finalData.total_visited += 1;
        } else {
          finalData.total_not_visited +=1;
        }
      }

      finalData.detail = details;
      respData = { status: 200, data: finalData }
      return res.status(respData.status).json(respData);
    } else {
      return res.status(dataWithParams.status).json(dataWithParams);
    }
  } catch (err) {
    // return next(err);
    respData = { status: 201, data: errorMsg };
  }
  return res.status(respData.status).json(respData);
}

export async function fetchIhChtDataPerChw(req: Request, res: Response, next: NextFunction) {
  const chwsData: { status: number, data: ChwsData[] } = await getChwsDataWithParams(req, res, next, true);
  const chws: { status: number, data: Chws[] } = await getChws(req, res, next, true);
  if (chwsData.status == 200 && chws.status == 200) {
    const dbChwsData: { chw: Chws, data: any }[] = getAllAboutData(chwsData.data, chws.data, req, res);
    if (!dbChwsData) return res.status(201).json({ status: 201, data: 'No data found !' });
    return res.status(200).json({ status: 200, data: dbChwsData });
  } else {
    return res.status(chwsData.status).json({ status: 201, data: 'No data found !' });
  }
}

function getAllAboutData(ChwsDataFromDb$: ChwsData[], Chws$: Chws[], req: Request, res: Response): { chw: Chws, data: any }[] {
  // 'Démarrage du calcule des indicateurs ...'
  const { start_date, end_date, sources, districts, sites, chws, withDhis2Data } = req.body;

  var outPutData: any = {
    home_visit: {},
    soins_pcime: {},
    suivi_pcime: {},
    reference_pcime: {},
    diarrhee_pcime: {},
    paludisme_pcime: {},
    pneumonie_pcime: {},
    malnutrition_pcime: {},
    prompt_pcime_diarrhee_24h: {},
    prompt_pcime_diarrhee_48h: {},
    prompt_pcime_diarrhee_72h: {},
    prompt_pcime_paludisme_24h: {},
    prompt_pcime_paludisme_48h: {},
    prompt_pcime_paludisme_72h: {},
    prompt_pcime_pneumonie_24h: {},
    prompt_pcime_pneumonie_48h: {},
    prompt_pcime_pneumonie_72h: {},
    reference_Pf: {},
    reference_enceinte_postpartum: {},
    femme_enceinte: {},
    femme_enceinte_NC: {},
    test_de_grossesse: {},
    femme_postpartum: {},
    femme_postpartum_NC: {},
    total_PF_NC: {},
    total_PF: {},
  }

  for (let i = 0; i < Chws$.length; i++) {
    const ascId = Chws$[i].id;
    if (ascId != null && ascId != '') {
      Object.entries(outPutData).map(([key, val]) => {
        const vals: any = val as any;
        if (!vals.hasOwnProperty(ascId)) vals[ascId] = { chwId: ascId, tonoudayo: 0, dhis2: 0 }
      });
    }
  }

  for (let i = 0; i < ChwsDataFromDb$.length; i++) {
    const data: ChwsData = ChwsDataFromDb$[i];
    if (data) {
      const form = data.form;
      const field = data.fields;
      const source: string = data.source != null && data.source != '' ? data.source : '';
      const site: string = data.site != null ? data.site.id != null && data.site.id != '' ? data.site.id : '' : '';
      const chw: string = data.chw != null ? data.chw.id != null && data.chw.id != '' ? data.chw.id : '' : '';

      const idSourceValid: boolean = notEmpty(source) && notEmpty(sources) && sources?.includes(source) || !notEmpty(sources);
      const idSiteValid: boolean = notEmpty(site) && notEmpty(sites) && sites?.includes(site) || !notEmpty(sites);
      const idChwValid: boolean = notEmpty(chw) && notEmpty(chws) && chws?.includes(chw) || !notEmpty(chws);
      const isDateValid: boolean = notEmpty(start_date) && notEmpty(end_date) ? DateUtils.isBetween(`${start_date}`, data.reported_date, `${end_date}`) : false;

      if (isDateValid && idSourceValid && idSiteValid && idChwValid) {
        if (data.source == 'Tonoudayo') {

          if (Consts.home_visit_form.includes(form!)) {
            outPutData.home_visit[chw].tonoudayo += 1;
          }

          if (["pcime_c_asc"].includes(form!)) {
            outPutData.soins_pcime[chw].tonoudayo += 1;
            if (field["group_review.s_have_you_refer_child"] == "yes") outPutData.reference_pcime[chw].tonoudayo += 1;
            if (field["has_diarrhea"] == "true") {
              outPutData.diarrhee_pcime[chw].tonoudayo += 1;
              if (field["within_24h"] == "true") outPutData.prompt_pcime_diarrhee_24h[chw].tonoudayo += 1;
              if (field["within_24h"] == "true" || field["within_48h"] == "true") outPutData.prompt_pcime_diarrhee_48h[chw].tonoudayo += 1;
              if (field["within_24h"] == "true" || field["within_48h"] == "true" || field["within_72h"] == "true") outPutData.prompt_pcime_diarrhee_72h[chw].tonoudayo += 1;
            }

            if (field["fever_with_malaria"] == "true") {
              outPutData.paludisme_pcime[chw].tonoudayo += 1;
              if (field["within_24h"] == "true") outPutData.prompt_pcime_paludisme_24h[chw].tonoudayo += 1;
              if (field["within_24h"] == "true" || field["within_48h"] == "true") outPutData.prompt_pcime_paludisme_48h[chw].tonoudayo += 1;
              if (field["within_24h"] == "true" || field["within_48h"] == "true" || field["within_72h"] == "true") outPutData.prompt_pcime_paludisme_72h[chw].tonoudayo += 1;
            }

            if (field["has_pneumonia"] == "true") {
              outPutData.pneumonie_pcime[chw].tonoudayo += 1;
              if (field["within_24h"] == "true") outPutData.prompt_pcime_pneumonie_24h[chw].tonoudayo += 1;
              if (field["within_24h"] == "true" || field["within_48h"] == "true") outPutData.prompt_pcime_pneumonie_48h[chw].tonoudayo += 1;
              if (field["within_24h"] == "true" || field["within_48h"] == "true" || field["within_72h"] == "true") outPutData.prompt_pcime_pneumonie_72h[chw].tonoudayo += 1;
            }

            if (field["has_malnutrition"] == "true") outPutData.malnutrition_pcime[chw].tonoudayo += 1;
          }

          if (Consts.child_followup_forms.includes(form!)) {
            outPutData.suivi_pcime[chw].tonoudayo += 1;
            if (field["group_review.s_have_you_refer_child"] == "yes") outPutData.reference_pcime[chw].tonoudayo += 1;
          }

          if (["prenatal_followup"].includes(form!)) {
            outPutData.femme_enceinte[chw].tonoudayo += 1;
            if (field["group_summary.s_have_you_refer_child"] == "yes") outPutData.reference_enceinte_postpartum[chw].tonoudayo += 1;
            if (field["follow_up_count"] == "1") outPutData.femme_enceinte_NC[chw].tonoudayo += 1;
          }

          if (["postnatal_followup"].includes(form!)) {
            outPutData.femme_postpartum[chw].tonoudayo += 1;
            if (field["group_summary.s_have_you_refer_child"] == "yes") outPutData.reference_enceinte_postpartum[chw].tonoudayo += 1;
            if (field["follow_up_count"] == "1") outPutData.femme_postpartum_NC[chw].tonoudayo += 1;
          }

          if (Consts.pregnancy_pf_forms.includes(form!)) {
            if (form == "pregnancy_family_planning") {
              var pregnant_1 = field["s_reg_pregnancy_screen.s_reg_urine_result"] == "positive"
              var pregnant_2 = field["s_reg_pregnancy_screen.s_reg_why_urine_test_not_done"] == "already_pregnant"
              if (field["s_reg_pregnancy_screen.s_reg_urine_test"] == "yes") outPutData.test_de_grossesse[chw].tonoudayo += 1;
              if (pregnant_1 == true || pregnant_2 == true) {
                outPutData.femme_enceinte[chw].tonoudayo += 1;
                if (field["s_summary.s_have_you_refer_child"] == "yes") outPutData.reference_enceinte_postpartum[chw].tonoudayo += 1;
              } else {
                outPutData.total_PF[chw].tonoudayo += 1;
                if (field["s_fam_plan_screen.agreed_to_fp"] == "yes") outPutData.total_PF_NC[chw].tonoudayo += 1;
                if (field["s_summary.s_have_you_refer_child"] == "yes") outPutData.reference_Pf[chw].tonoudayo += 1;
              }
            } else if (form == "women_emergency_followup") {
              if (field["group_summary.s_have_you_refer_child"] == "yes") outPutData.reference_enceinte_postpartum[chw].tonoudayo += 1;
              if (field["initial.woman_status"] == "pregnant") {
                outPutData.femme_enceinte[chw].tonoudayo += 1;
              } else if (field["initial.woman_status"] == "postpartum") {
                outPutData.femme_postpartum[chw].tonoudayo += 1;
              } else {
                outPutData.home_visit[chw].dhis2 += 1;
              }
            } else if (form == "delivery") {
              outPutData.femme_postpartum[chw].tonoudayo += 1;
              if (field["group_summary.s_have_you_refer_child"] == "yes") outPutData.reference_enceinte_postpartum[chw].tonoudayo += 1
            } else if (form == "fp_followup_danger_sign_check") {
              outPutData.total_PF[chw].tonoudayo += 1;
              if (field["s_summary.r_have_you_refer_child"]) outPutData.reference_Pf[chw].tonoudayo += 1;
            } else if (form == "fp_follow_up_renewal") {
              outPutData.total_PF[chw].tonoudayo += 1;
              if (field["checklist2.s_refer_for_health_state"] == "true") outPutData.reference_Pf[chw].tonoudayo += 1;
            }
          }

        }

        if (data.source == 'dhis2' && (withDhis2Data == true || withDhis2Data == 'true')) {

          if (form === "PCIME") {
            // (data.fields['BLWjEQQdBFi'] * 365) >= 60 || (data.fields['BLWjEQQdBFi'] * 365) < 60
            if (data.fields['zNldrz5EUPR'] == 'Soins') {
              outPutData.soins_pcime[chw].dhis2 += 1;
              if (data.fields['NPHYf8WAR9l'] == 'true') {// diarrhee
                outPutData.diarrhee_pcime[chw].dhis2 += 1;
                if (data.fields['U3c13SP8AQz'] == '≤24') outPutData.prompt_pcime_diarrhee_24h[chw].dhis2 += 1;
                if (data.fields['U3c13SP8AQz'] == '≤24' || data.fields['U3c13SP8AQz'] == '≤48') outPutData.prompt_pcime_diarrhee_48h[chw].dhis2 += 1;
                if (data.fields['U3c13SP8AQz'] == '≤24' || data.fields['U3c13SP8AQz'] == '≤48' || data.fields['U3c13SP8AQz'] == '≤72') outPutData.prompt_pcime_diarrhee_72h[chw].dhis2 += 1;
              }
              if (data.fields['Gl7HGePuIi3'] == 'true') {// paludisme
                outPutData.paludisme_pcime[chw].dhis2 += 1;
                if (data.fields['U3c13SP8AQz'] == '≤24') outPutData.prompt_pcime_paludisme_24h[chw].dhis2 += 1;
                if (data.fields['U3c13SP8AQz'] == '≤24' || data.fields['U3c13SP8AQz'] == '≤48') outPutData.prompt_pcime_paludisme_48h[chw].dhis2 += 1;
                if (data.fields['U3c13SP8AQz'] == '≤24' || data.fields['U3c13SP8AQz'] == '≤48' || data.fields['U3c13SP8AQz'] == '≤72') outPutData.prompt_pcime_paludisme_72h[chw].dhis2 += 1;
              }
              if (data.fields['LP33fMJRWrT'] == 'true') {// pneumonie
                outPutData.pneumonie_pcime[chw].dhis2 += 1;
                if (data.fields['U3c13SP8AQz'] == '≤24') outPutData.prompt_pcime_pneumonie_24h[chw].dhis2 += 1;
                if (data.fields['U3c13SP8AQz'] == '≤24' || data.fields['U3c13SP8AQz'] == '≤48') outPutData.prompt_pcime_pneumonie_48h[chw].dhis2 += 1;
                if (data.fields['U3c13SP8AQz'] == '≤24' || data.fields['U3c13SP8AQz'] == '≤48' || data.fields['U3c13SP8AQz'] == '≤72') outPutData.prompt_pcime_pneumonie_72h[chw].dhis2 += 1;
              }
              if (data.fields['y84NNODZ705'] == 'true') {// malnutrition
                outPutData.malnutrition_pcime[chw].dhis2 += 1;
              }
              if (data.fields['pMjjh6JLEz2'] == 'Oui') outPutData.reference_pcime[chw].dhis2 += 1; // référence
            } else if (data.fields['zNldrz5EUPR'] == 'Suivi') {
              outPutData.suivi_pcime[chw].dhis2 += 1;
              if (data.fields['pMjjh6JLEz2'] == 'Oui') outPutData.reference_pcime[chw].dhis2 += 1; // référence
            } else {
              outPutData.suivi_pcime[chw].dhis2 += 1;
            }
          }
          if (form === "Maternelle") {
            // data.fields['WRwCp1UsW3b'] == "CPON1" || data.fields['rFlbd27poqd'] == 'CPN1'
            if (data.fields['DNzefvCYfZz'] == "true") outPutData.test_de_grossesse[chw].dhis2 += 1; //test_de_grossesse
            if (data.fields['reULiF7LW3w'] == 'Enceinte') {
              outPutData.femme_enceinte[chw].dhis2 += 1;
              if (data.fields['pMjjh6JLEz2'] == 'Oui') outPutData.reference_enceinte_postpartum[chw].dhis2 += 1; // référence
              if (data.fields['WaN8nOieIhs'] == 'NC') outPutData.femme_enceinte_NC[chw].dhis2 += 1;
            } else if (data.fields['reULiF7LW3w'] == 'Post_Partum') {
              outPutData.femme_postpartum[chw].dhis2 += 1;
              if (data.fields['pMjjh6JLEz2'] == 'Oui') outPutData.reference_enceinte_postpartum[chw].dhis2 += 1; // référence
              if (data.fields['WaN8nOieIhs'] == 'NC') outPutData.femme_postpartum_NC[chw].dhis2 += 1;
            } else {
              outPutData.home_visit[chw].dhis2 += 1;
            }
          }

          if (form === "PF") {
            if (data.fields['DNzefvCYfZz'] == "true") outPutData.test_de_grossesse[chw].dhis2 += 1; //test_de_grossesse
            if (data.fields['pMjjh6JLEz2'] == 'Oui') outPutData.reference_Pf[chw].dhis2 += 1; // référence
            if (data.fields['kY42apNsghu'] == 'Oui') {// pf_administree
              outPutData.total_PF[chw].dhis2 += 1;
              if (data.fields['WaN8nOieIhs'] == 'NC') outPutData.total_PF_NC[chw].dhis2 += 1;
            } else {
              outPutData.home_visit[chw].dhis2 += 1;
            }
          }
          if (form === "Recherche") {
            outPutData.home_visit[chw].dhis2 += 1;
          }
        }

      }
    }
  }

  return transformChwsData(outPutData, Chws$, req, res);

}

function transformChwsData(allDatasFound: any, Chws$: Chws[], req: Request, res: Response): { chw: Chws, data: any }[] {
  const { end_date, params, withDhis2Data } = req.body;

  var allAggragateData: { chw: Chws, data: any }[] = [];

  // for (let i = 0; i < Chws$.length; i++) {
  //   const chw: Chws = Chws$[i];
  //   const ascId = chw.id!;

  //   var chwsData: DataIndicators = {
  //     total_vad: { tonoudayo: 0, dhis2: 0 },
  //     sum_soins_suivi: { tonoudayo: 0, dhis2: 0 },
  //     soins_pcime: { tonoudayo: 0, dhis2: 0 },
  //     suivi_pcime: { tonoudayo: 0, dhis2: 0 },
  //     femmes_enceinte: { tonoudayo: 0, dhis2: 0 },
  //     femmes_postpartum: { tonoudayo: 0, dhis2: 0 },
  //     home_visit: { tonoudayo: 0, dhis2: 0 },
  //     pf: { tonoudayo: 0, dhis2: 0 },
  //     reference_pf: { tonoudayo: 0, dhis2: 0 },
  //     reference_pcime: { tonoudayo: 0, dhis2: 0 },
  //     reference_femmes_enceinte_postpartum: { tonoudayo: 0, dhis2: 0 },
  //     diarrhee_pcime: { tonoudayo: 0, dhis2: 0 },
  //     paludisme_pcime: { tonoudayo: 0, dhis2: 0 },
  //     pneumonie_pcime: { tonoudayo: 0, dhis2: 0 },
  //     malnutrition_pcime: { tonoudayo: 0, dhis2: 0 },
  //     prompt_pcime_diarrhee_24h: { tonoudayo: 0, dhis2: 0 },
  //     prompt_pcime_diarrhee_48h: { tonoudayo: 0, dhis2: 0 },
  //     prompt_pcime_diarrhee_72h: { tonoudayo: 0, dhis2: 0 },
  //     prompt_pcime_paludisme_24h: { tonoudayo: 0, dhis2: 0 },
  //     prompt_pcime_paludisme_48h: { tonoudayo: 0, dhis2: 0 },
  //     prompt_pcime_paludisme_72h: { tonoudayo: 0, dhis2: 0 },
  //     prompt_pcime_pneumonie_24h: { tonoudayo: 0, dhis2: 0 },
  //     prompt_pcime_pneumonie_48h: { tonoudayo: 0, dhis2: 0 },
  //     prompt_pcime_pneumonie_72h: { tonoudayo: 0, dhis2: 0 },
  //     femmes_enceintes_NC: { tonoudayo: 0, dhis2: 0 },
  //     femme_postpartum_NC: { tonoudayo: 0, dhis2: 0 },
  //     test_de_grossesse: { tonoudayo: 0, dhis2: 0 },

  //     sum_total_vad: 0,
  //     sum_soins_pcime: 0,
  //     sum_suivi_pcime: 0,
  //     sum_pcime: 0,
  //     sum_femmes_enceinte: 0,
  //     sum_femmes_postpartum: 0,
  //     sum_enceinte_postpartum: {
  //       tonoudayo: 0,
  //       dhis2: 0
  //     },
  //     sum_maternel: 0,
  //     sum_home_visit: 0,
  //     sum_pf: 0,
  //     sum_reference_pf: 0,
  //     sum_reference_pcime: 0,
  //     sum_reference_femmes_enceinte_postpartum: 0,
  //     sum_diarrhee_pcime: 0,
  //     sum_paludisme_pcime: 0,
  //     sum_pneumonie_pcime: 0,
  //     sum_malnutrition_pcime: 0,
  //     sum_prompt_pcime_diarrhee_24h: 0,
  //     sum_prompt_pcime_diarrhee_48h: 0,
  //     sum_prompt_pcime_diarrhee_72h: 0,
  //     sum_prompt_pcime_paludisme_24h: 0,
  //     sum_prompt_pcime_paludisme_48h: 0,
  //     sum_prompt_pcime_paludisme_72h: 0,
  //     sum_prompt_pcime_pneumonie_24h: 0,
  //     sum_prompt_pcime_pneumonie_48h: 0,
  //     sum_prompt_pcime_pneumonie_72h: 0,
  //     sum_femmes_enceintes_NC: 0,
  //     sum_femme_postpartum_NC: 0,
  //     sum_test_de_grossesse: 0
  //   };

  //   if (params != 'onlydata') {
  //     chwsData.orgUnit = '';
  //     chwsData.reported_date = '';
  //     chwsData.code_asc = '';
  //     chwsData.district = '';
  //     chwsData.data_source = '';
  //   }

  //   // Tonoudayo
  //   const tonoudayo_pcime = allDatasFound.soins_pcime[ascId]["tonoudayo"] + allDatasFound.suivi_pcime[ascId]["tonoudayo"];
  //   const tonoudayo_total_vad = tonoudayo_pcime +
  //     allDatasFound.femme_enceinte[ascId]["tonoudayo"] +
  //     allDatasFound.femme_postpartum[ascId]["tonoudayo"] +
  //     allDatasFound.home_visit[ascId]["tonoudayo"] +
  //     allDatasFound.total_PF[ascId]["tonoudayo"];

  //   if (params != 'onlydata' && withDhis2Data != true && withDhis2Data != 'true') {
  //     chwsData.orgUnit += chw.site?.external_id!;
  //     chwsData.reported_date += end_date;
  //     chwsData.code_asc += chw.external_id!;
  //     chwsData.district += chw.district?.name!;
  //     chwsData.data_source += 'medic';
  //   }
  //   chwsData.total_vad.tonoudayo += tonoudayo_total_vad;
  //   chwsData.sum_soins_suivi.tonoudayo += tonoudayo_pcime;
  //   chwsData.soins_pcime.tonoudayo += allDatasFound.soins_pcime[ascId]["tonoudayo"];
  //   chwsData.suivi_pcime.tonoudayo += allDatasFound.suivi_pcime[ascId]["tonoudayo"];

  //   chwsData.femmes_enceinte.tonoudayo += allDatasFound.femme_enceinte[ascId]["tonoudayo"];
  //   chwsData.femmes_postpartum.tonoudayo += allDatasFound.femme_postpartum[ascId]["tonoudayo"];;
  //   chwsData.home_visit.tonoudayo += allDatasFound.home_visit[ascId]["tonoudayo"];

  //   chwsData.pf.tonoudayo += allDatasFound.total_PF[ascId]["tonoudayo"];
  //   chwsData.reference_pf.tonoudayo += allDatasFound.reference_Pf[ascId]["tonoudayo"];
  //   chwsData.reference_pcime.tonoudayo += allDatasFound.reference_pcime[ascId]["tonoudayo"]
  //   chwsData.reference_femmes_enceinte_postpartum.tonoudayo += allDatasFound.reference_enceinte_postpartum[ascId]["tonoudayo"];

  //   chwsData.diarrhee_pcime.tonoudayo += allDatasFound.diarrhee_pcime[ascId]["tonoudayo"];
  //   chwsData.paludisme_pcime.tonoudayo += allDatasFound.paludisme_pcime[ascId]["tonoudayo"];
  //   chwsData.pneumonie_pcime.tonoudayo += allDatasFound.pneumonie_pcime[ascId]["tonoudayo"];
  //   chwsData.malnutrition_pcime.tonoudayo += allDatasFound.malnutrition_pcime[ascId]["tonoudayo"];

  //   chwsData.prompt_pcime_diarrhee_24h.tonoudayo += allDatasFound.prompt_pcime_diarrhee_24h[ascId]["tonoudayo"];
  //   chwsData.prompt_pcime_diarrhee_48h.tonoudayo += allDatasFound.prompt_pcime_diarrhee_48h[ascId]["tonoudayo"];
  //   chwsData.prompt_pcime_diarrhee_72h.tonoudayo += allDatasFound.prompt_pcime_diarrhee_72h[ascId]["tonoudayo"];

  //   chwsData.prompt_pcime_paludisme_24h.tonoudayo += allDatasFound.prompt_pcime_paludisme_24h[ascId]["tonoudayo"];
  //   chwsData.prompt_pcime_paludisme_48h.tonoudayo += allDatasFound.prompt_pcime_paludisme_48h[ascId]["tonoudayo"];
  //   chwsData.prompt_pcime_paludisme_72h.tonoudayo += allDatasFound.prompt_pcime_paludisme_72h[ascId]["tonoudayo"];

  //   chwsData.prompt_pcime_pneumonie_24h.tonoudayo += allDatasFound.prompt_pcime_pneumonie_24h[ascId]["tonoudayo"];
  //   chwsData.prompt_pcime_pneumonie_48h.tonoudayo += allDatasFound.prompt_pcime_pneumonie_48h[ascId]["tonoudayo"];
  //   chwsData.prompt_pcime_pneumonie_72h.tonoudayo += allDatasFound.prompt_pcime_pneumonie_72h[ascId]["tonoudayo"];

  //   chwsData.femmes_enceintes_NC.tonoudayo += allDatasFound.femme_enceinte_NC[ascId]["tonoudayo"];
  //   chwsData.femme_postpartum_NC.tonoudayo += allDatasFound.femme_postpartum_NC[ascId]["tonoudayo"];
  //   chwsData.test_de_grossesse.tonoudayo += allDatasFound.test_de_grossesse[ascId]["tonoudayo"];

  //   if (withDhis2Data == true || withDhis2Data == 'true') {
  //     // Dhis2
  //     const dhis2_pcime = allDatasFound.soins_pcime[ascId]["dhis2"] + allDatasFound.suivi_pcime[ascId]["dhis2"];
  //     const dhis2_total_vad = dhis2_pcime +
  //       allDatasFound.femme_enceinte[ascId]["dhis2"] +
  //       allDatasFound.femme_postpartum[ascId]["dhis2"] +
  //       allDatasFound.home_visit[ascId]["dhis2"] +
  //       allDatasFound.total_PF[ascId]["dhis2"];

  //     chwsData.total_vad.dhis2 += dhis2_total_vad;
  //     chwsData.sum_soins_suivi.dhis2 += dhis2_pcime;
  //     chwsData.soins_pcime.dhis2 += allDatasFound.soins_pcime[ascId]["dhis2"];
  //     chwsData.suivi_pcime.dhis2 += allDatasFound.suivi_pcime[ascId]["dhis2"];
  //     chwsData.femmes_enceinte.dhis2 += allDatasFound.femme_enceinte[ascId]["dhis2"];
  //     chwsData.femmes_postpartum.dhis2 += allDatasFound.femme_postpartum[ascId]["dhis2"]
  //     chwsData.home_visit.dhis2 += allDatasFound.home_visit[ascId]["dhis2"];
  //     chwsData.pf.dhis2 += allDatasFound.total_PF[ascId]["dhis2"];
  //     chwsData.reference_pf.dhis2 += allDatasFound.reference_Pf[ascId]["dhis2"];
  //     chwsData.reference_pcime.dhis2 += allDatasFound.reference_pcime[ascId]["dhis2"];
  //     chwsData.reference_femmes_enceinte_postpartum.dhis2 += allDatasFound.reference_enceinte_postpartum[ascId]["dhis2"];
  //     chwsData.diarrhee_pcime.dhis2 += allDatasFound.diarrhee_pcime[ascId]["dhis2"];
  //     chwsData.paludisme_pcime.dhis2 += allDatasFound.paludisme_pcime[ascId]["dhis2"];
  //     chwsData.pneumonie_pcime.dhis2 += allDatasFound.pneumonie_pcime[ascId]["dhis2"];
  //     chwsData.malnutrition_pcime.dhis2 += allDatasFound.malnutrition_pcime[ascId]["dhis2"];

  //     chwsData.prompt_pcime_diarrhee_24h.dhis2 += allDatasFound.prompt_pcime_diarrhee_24h[ascId]["dhis2"];
  //     chwsData.prompt_pcime_diarrhee_48h.dhis2 += allDatasFound.prompt_pcime_diarrhee_48h[ascId]["dhis2"];
  //     chwsData.prompt_pcime_diarrhee_72h.dhis2 += allDatasFound.prompt_pcime_diarrhee_72h[ascId]["dhis2"];

  //     chwsData.prompt_pcime_paludisme_24h.dhis2 += allDatasFound.prompt_pcime_paludisme_24h[ascId]["dhis2"];
  //     chwsData.prompt_pcime_paludisme_48h.dhis2 += allDatasFound.prompt_pcime_paludisme_48h[ascId]["dhis2"];
  //     chwsData.prompt_pcime_paludisme_72h.dhis2 += allDatasFound.prompt_pcime_paludisme_72h[ascId]["dhis2"];

  //     chwsData.prompt_pcime_pneumonie_24h.dhis2 += allDatasFound.prompt_pcime_pneumonie_24h[ascId]["dhis2"];
  //     chwsData.prompt_pcime_pneumonie_48h.dhis2 += allDatasFound.prompt_pcime_pneumonie_48h[ascId]["dhis2"];
  //     chwsData.prompt_pcime_pneumonie_72h.dhis2 += allDatasFound.prompt_pcime_pneumonie_72h[ascId]["dhis2"];

  //     chwsData.femmes_enceintes_NC.dhis2 += allDatasFound.femme_enceinte_NC[ascId]["dhis2"];
  //     chwsData.femme_postpartum_NC.dhis2 += allDatasFound.femme_postpartum_NC[ascId]["dhis2"];
  //     chwsData.test_de_grossesse.dhis2 += allDatasFound.test_de_grossesse[ascId]["dhis2"];
  //   }

  //   chwsData.sum_total_vad = chwsData.total_vad.tonoudayo + chwsData.total_vad.dhis2;
  //   chwsData.sum_soins_pcime = chwsData.soins_pcime.tonoudayo + chwsData.soins_pcime.dhis2;
  //   chwsData.sum_suivi_pcime = chwsData.suivi_pcime.tonoudayo + chwsData.suivi_pcime.dhis2;
  //   chwsData.sum_pcime = chwsData.sum_soins_suivi.tonoudayo + chwsData.sum_soins_suivi.dhis2;
  //   chwsData.sum_femmes_enceinte = chwsData.femmes_enceinte.tonoudayo + chwsData.femmes_enceinte.dhis2;
  //   chwsData.sum_femmes_postpartum = chwsData.femmes_postpartum.tonoudayo + chwsData.femmes_postpartum.dhis2;
  //   chwsData.sum_enceinte_postpartum = { tonoudayo: chwsData.femmes_enceinte.tonoudayo + chwsData.femmes_postpartum.tonoudayo, dhis2: chwsData.femmes_enceinte.dhis2 + chwsData.femmes_postpartum.dhis2 };
  //   chwsData.sum_maternel = chwsData.sum_enceinte_postpartum.tonoudayo + chwsData.sum_enceinte_postpartum.dhis2;
  //   chwsData.sum_home_visit = chwsData.home_visit.tonoudayo + chwsData.home_visit.dhis2;
  //   chwsData.sum_pf = chwsData.pf.tonoudayo + chwsData.pf.dhis2;
  //   chwsData.sum_reference_pf = chwsData.reference_pf.tonoudayo + chwsData.reference_pf.dhis2;
  //   chwsData.sum_reference_pcime = chwsData.reference_pcime.tonoudayo + chwsData.reference_pcime.dhis2;
  //   chwsData.sum_reference_femmes_enceinte_postpartum = chwsData.reference_femmes_enceinte_postpartum.tonoudayo + chwsData.reference_femmes_enceinte_postpartum.dhis2;
  //   chwsData.sum_diarrhee_pcime = chwsData.diarrhee_pcime.tonoudayo + chwsData.diarrhee_pcime.dhis2;
  //   chwsData.sum_paludisme_pcime = chwsData.paludisme_pcime.tonoudayo + chwsData.paludisme_pcime.dhis2;
  //   chwsData.sum_pneumonie_pcime = chwsData.pneumonie_pcime.tonoudayo + chwsData.pneumonie_pcime.dhis2;
  //   chwsData.sum_malnutrition_pcime = chwsData.malnutrition_pcime.tonoudayo + chwsData.malnutrition_pcime.dhis2;
  //   chwsData.sum_prompt_pcime_diarrhee_24h = chwsData.prompt_pcime_diarrhee_24h.tonoudayo + chwsData.prompt_pcime_diarrhee_24h.dhis2;
  //   chwsData.sum_prompt_pcime_diarrhee_48h = chwsData.prompt_pcime_diarrhee_48h.tonoudayo + chwsData.prompt_pcime_diarrhee_48h.dhis2;
  //   chwsData.sum_prompt_pcime_diarrhee_72h = chwsData.prompt_pcime_diarrhee_72h.tonoudayo + chwsData.prompt_pcime_diarrhee_72h.dhis2;
  //   chwsData.sum_prompt_pcime_paludisme_24h = chwsData.prompt_pcime_paludisme_24h.tonoudayo + chwsData.prompt_pcime_paludisme_24h.dhis2;
  //   chwsData.sum_prompt_pcime_paludisme_48h = chwsData.prompt_pcime_paludisme_48h.tonoudayo + chwsData.prompt_pcime_paludisme_48h.dhis2;
  //   chwsData.sum_prompt_pcime_paludisme_72h = chwsData.prompt_pcime_paludisme_72h.tonoudayo + chwsData.prompt_pcime_paludisme_72h.dhis2;
  //   chwsData.sum_prompt_pcime_pneumonie_24h = chwsData.prompt_pcime_pneumonie_24h.tonoudayo + chwsData.prompt_pcime_pneumonie_24h.dhis2;
  //   chwsData.sum_prompt_pcime_pneumonie_48h = chwsData.prompt_pcime_pneumonie_48h.tonoudayo + chwsData.prompt_pcime_pneumonie_48h.dhis2;
  //   chwsData.sum_prompt_pcime_pneumonie_72h = chwsData.prompt_pcime_pneumonie_72h.tonoudayo + chwsData.prompt_pcime_pneumonie_72h.dhis2;
  //   chwsData.sum_femmes_enceintes_NC = chwsData.femmes_enceintes_NC.tonoudayo + chwsData.femmes_enceintes_NC.dhis2;
  //   chwsData.sum_femme_postpartum_NC = chwsData.femme_postpartum_NC.tonoudayo + chwsData.femme_postpartum_NC.dhis2;
  //   chwsData.sum_test_de_grossesse = chwsData.test_de_grossesse.tonoudayo + chwsData.test_de_grossesse.dhis2;


  //   allAggragateData.push({ chw: chw, data: chwsData });
  // }

  return allAggragateData;
}

export async function deleteChwsData(req: Request, res: Response, next: NextFunction) { }

