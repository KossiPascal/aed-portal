import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { ChwsData, getChwsDataSyncRepository, getSiteSyncRepository, Sites } from "../entity/Sync";
import { User } from "../entity/User";
import { CouchDbFetchData } from "../utils/appInterface";
import { notEmpty, DateUtils, sslFolder, logNginx, delay, CouchDbFetchDataOptions, Functions } from "../utils/functions";
import { Consts } from "../utils/constantes";
const request = require('request');

require('dotenv').config({ path: sslFolder('.aed-env') });

const { LOCALHOST, CHT_HOST, PROD_PORT_SECURED, DEV_PORT, DEV_PORT_SECURED } = process.env

const portSecured = Functions.normalizePort((Consts.isProdEnv ? PROD_PORT_SECURED : DEV_PORT_SECURED) || Consts.defaultSecurePort);


export async function AutoSyncDataFromCloud(data?: { wait: boolean, customDate: { start_date: string, end_date: string }, createOutputFile: boolean }, req?: Request, res?: Response, next?: NextFunction) {
  var output: { orgunit: any, tonoudayo: any, globalError: any, successDetails:any } = { orgunit: null, tonoudayo: null, globalError: null, successDetails:null };
  try {
    const createOutputFile = data != null && notEmpty(data.createOutputFile) && data.createOutputFile != null ? data.createOutputFile : true;
    // const wait = data!=null && notEmpty(data.wait) && data.wait != null ? data.wait : true;
    // if(data.wait == true) await delay(60000);
    const startDate = new Date();
    const startAt = (startDate).getTime();
    const customDate = data != null && notEmpty(data.customDate) && data.customDate != null ? data.customDate : null;

    
    var initDate: {start_date: string,end_date: string};

    if (notEmpty(customDate) && customDate != null) {
      initDate = customDate;
    } else {
      const initD =  DateUtils.startEnd21and20Date();
      const str = initD.start_date.split('-');
      initDate = { start_date: `${str[0]}-${str[1]}-01`, end_date: initD.end_date };
    }

    const start_date = initDate.start_date;
    const end_date = initDate.end_date;
    const api_host = `https://${LOCALHOST || CHT_HOST}:${portSecured}/api`;
    const headers = { "Content-Type": "application/json" };





          // console.log('\n\nstart fetching tonoudayo data\n');
          // logNginx('\n\nstart fetching tonoudayo data\n');
          // request({
          //   url: `${api_host}/sync/fetch/data`,
          //   method: 'POST',
          //   body: JSON.stringify({
          //     start_date: start_date,
          //     end_date: end_date,
          //     usersession: user.usersession,
          //     userId: user.id,
          //     privileges: true
          //   }),
          //   headers: headers
          // }, async function (error2: any, response2: any, body2: any) {
          //   if (!error2 && notEmpty(body2)) output.tonoudayo = JSON.parse(`${body2}`);

          //   const repository = await getSiteSyncRepository();
          //   var sites: Sites[] = await repository.find();
          //   var _resp = [];
          //   for (let ou = 0; ou < sites.length; ou++) {
          //     const orgUnit = sites[ou].external_id;
          //     console.log(`\n\nstart fetching dhis2 data with orgUnit = ${orgUnit}\n`);
          //     logNginx(`\n\nstart fetching dhis2 data with orgUnit = ${orgUnit}\n`);
          //     request({
          //       url: `${api_host}/sync/dhis2/data`,
          //       method: 'POST',
          //       body: JSON.stringify({
          //         orgUnit: orgUnit,
          //         filter: [`RlquY86kI66:GE:${start_date}:LE:${end_date}`],
          //         fields: ['event', 'orgUnit', 'orgUnitName', 'dataValues[dataElement,value]'],
          //         usersession: user.usersession,
          //         userId: user.id,
          //         privileges: true
          //       }),

          //       headers: headers
          //     }, async function (error3: any, response3: any, body3: any) {
          //       if (!error3 && notEmpty(body3)) output.dhis2.push(JSON.parse(`${body3}`));
          //       _resp.push('Ok');
          //       if (_resp.length == sites.length) {

          //         const now = new Date();
          //         const seconds = (now.getTime() - startAt) / 1000;
          //         const display = seconds <= 60 ? `${seconds} sec` : (seconds / 60) <= 60 ? `${(seconds / 60).toFixed(2)} min` : `${((seconds / 60) / 60).toFixed(2)} h`;

          //         const starts = DateUtils.getDateInFormat(startDate, 0, `en`, true);
          //         const ends = DateUtils.getDateInFormat(now, 0, `en`, true);
          //         const details = {
          //           start_at: starts.split(' ')[1],
          //           start_at_timestamp: startAt,
          //           end_at: ends.split(' ')[1],
          //           end_at_timestamp: now.getTime(),
          //           duration: display,
          //           start_date_filter:initDate.start_date,
          //           end_date_filter:initDate.end_date
          //         };

          //         if (createOutputFile == true) {
          //           const syncFound = await _repoSync.getBy(DateUtils.getDateInFormat(now));
          //           var sync: any;
          //           if (!syncFound) {
          //             sync = {
          //               id: ends.split(' ')[0],
          //               details: [
          //                 details
          //               ]
          //             }
          //           } else {
          //             syncFound.details.push(details);
          //             sync = syncFound;
          //           }
          //           await _repoSync.save(sync);
          //         }
          //         console.log(`\n\nDurée de l'action: ${display}\n`);
          //         logNginx(`\n\nDurée de l'action: ${display}\n`);
          //         output.successDetails = {
          //           date:ends.split(' ')[0],
          //           start_at: starts.split(' ')[1],
          //           start_at_timestamp: startAt,
          //           end_at: ends.split(' ')[1],
          //           end_at_timestamp: now.getTime(),
          //           duration: display,
          //           start_date_filter:initDate.start_date,
          //           end_date_filter:initDate.end_date
          //         }
                  
          //         if (res!=null) return res.status(200).json({ status: 200, data: output });
          //       };
          //     });
          //   }
          // });


  } catch (err: any) {
    output.globalError=`${err}`;
    if (res!=null) return res.status(201).json({ status: 201, data: output });
  }

}

export async function SyncAllCloudAppDataToDB(req: Request, res: Response, next: NextFunction) {
  const data = { wait: false, customDate: { start_date: req.body.start_date, end_date: req.body.end_date }, createOutputFile: false };
  await AutoSyncDataFromCloud(data, req, res, next);
}




