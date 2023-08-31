import { getChwsDataSyncRepository, ChwsData, Sites, getSiteSyncRepository, getPatientSyncRepository, Patients, getChwsSyncRepository, Chws, getZoneSyncRepository, Zones } from "../entity/Sync";
import { CouchDbFetchData } from "../utils/appInterface";
import { Functions, CouchDbFetchDataOptions } from "../utils/functions";
import { NextFunction, Request, Response } from "express";
import { validationResult } from 'express-validator';
import https from 'https';



const _sepation = `\n\n\n\n__________\n\n\n\n`;

export async function fetchChwsDataFromCouchDb(req: Request, resp: Response, next: NextFunction) {

    var outPutInfo: any = {};

    if (!validationResult(req).isEmpty()) {
        outPutInfo["Message"] = {}
        outPutInfo["Message"]["errorElements"] = "Your request provides was rejected !";
        resp.status(500).json(outPutInfo);
        return;
    }

    var params: CouchDbFetchData = {
        viewName: 'reports_by_date',
        startKey: [Functions.date_to_milisecond(req.body.start_date, true)],
        endKey: [Functions.date_to_milisecond(req.body.end_date, false)],
    };

    try {
        https.get(CouchDbFetchDataOptions(params), async function (res) {
            var body = "";
            res.on('data', (data) => {
                body += data.toString();
            });
            res.on('end', async () => {
                try {
                    const repository = await getChwsDataSyncRepository();
                    const _repoSite = await getSiteSyncRepository();
                    var jsonBody: any = JSON.parse(body).rows;
                    if (jsonBody !== undefined && jsonBody !== '' && jsonBody !== null) {
                        var len = jsonBody.length;
                        var done: number = 0;

                        for (let i = 0; i < len; i++) {
                            done++;
                            const row: any = jsonBody[i];
                            if (row.doc.hasOwnProperty('form') && row.doc.hasOwnProperty('fields')) {
                                if (row.doc.fields.hasOwnProperty('patient_id')) {
                                    const siteId = row.doc.contact.parent.parent._id;
                                    
                                    if (siteId) {
                                        if (!outPutInfo.hasOwnProperty("Données Total")) outPutInfo["Données Total"] = { successCount: 0, errorCount: 0, errorElements: '', errorIds: '' }
                                        try {
                                            const contactParent = row.doc.fields.inputs.contact.parent;
                                            const contactId = row.doc.fields.inputs.contact._id;
                                            const _sync = new ChwsData();
                                            _sync.source = 'Tonoudayo';
                                            _sync.id = row.doc._id;
                                            _sync.rev = row.doc._rev;
                                            _sync.form = row.doc.form;
                                            _sync.phone = row.doc.from;
                                            _sync.reported_date = Functions.milisecond_to_date(row.doc.reported_date, 'dateOnly');
                                            _sync.reported_full_date = Functions.milisecond_to_date(row.doc.reported_date, 'fulldate');
                                            _sync.site = siteId;
                                            _sync.zone = row.doc.contact.parent._id;
                                            _sync.chw = row.doc.contact._id;

                                            _sync.family_id = ['home_visit'].includes(row.doc.form) ? contactId : contactParent;
                                            _sync.patient_id = ['home_visit'].includes(row.doc.form) ? null : contactId;
                                            _sync.fields = Functions.getJsonFieldsAsKeyValue('', row.doc.fields);
                                            // _sync.patient_id = row.doc.fields.patient_id;
                                            if (!row.doc.geolocation.hasOwnProperty('code')) _sync.geolocation = Functions.getJsonFieldsAsKeyValue('', row.doc.geolocation);
                                            await repository.save(_sync);
                                            outPutInfo["Données Total"]["successCount"] += 1;
                                        } catch (err: any) {
                                            outPutInfo["Données Total"]["errorCount"] += 1;
                                            outPutInfo["Données Total"]["errorElements"] += `${_sepation}${err.toString()}`;
                                            outPutInfo["Données Total"]["errorIds"] += `${_sepation}${row.doc._id}`;

                                            // outPutInfo["ErrorMsg"] = {}
                                            // outPutInfo["ErrorMsg"]["error"] = err.toString()
                                        }
                                    }
                                }
                            }
                        }

                        if (done === len) return resp.status(200).json(outPutInfo);
                    } else {
                        return resp.status(200).json(outPutInfo);
                    }
                    // if (sync.use_SSL_verification !== true) NODE_TLS_REJECT_UNAUTHORIZED = undefined;
                } catch (err: any) {
                    // NODE_TLS_REJECT_UNAUTHORIZED = undefined;
                    if (!err.statusCode) err.statusCode = 500;
                    outPutInfo["Message"] = {}
                    outPutInfo["Message"]["errorElements"] = err.message;
                    resp.status(err.statusCode).json(outPutInfo);
                }
            });
            process.on('uncaughtException', (err: any) => {
                if (!err.statusCode) err.statusCode = 500;
                outPutInfo["Message"] = {}
                outPutInfo["Message"]["errorElements"] = err.message;
                resp.status(err.statusCode).json(outPutInfo);
            });
            res.on('error', (err: any) => {
                if (!err.statusCode) err.statusCode = 500;
                outPutInfo["Message"] = {}
                outPutInfo["Message"]["errorElements"] = err.message;
                resp.status(err.statusCode).json(outPutInfo);
            });
        });
    } catch (err: any) {
        if (!err.statusCode) err.statusCode = 500;
        outPutInfo["Message"] = {}
        outPutInfo["Message"]["errorElements"] = err.message;
        resp.status(err.statusCode).json(outPutInfo);
    }
}

export async function fetchOrgUnitsFromCouchDb(req: Request, resp: Response, next: NextFunction) {
    var outPutInfo: any = {};
    if (!validationResult(req).isEmpty()) {
        outPutInfo["Message"] = {}
        outPutInfo["Message"]["errorElements"] = "Your request provides was rejected !";
        return resp.status(500).json(outPutInfo);
    }

    var params: CouchDbFetchData = {
        viewName: 'contacts_by_date', //'contacts_by_type',
        startKey: [Functions.date_to_milisecond(req.body.start_date, true)],
        endKey: [Functions.date_to_milisecond(req.body.end_date, false)],
    };

    try {

        https.get(CouchDbFetchDataOptions(params), async function (res) {
            var body = "";
            res.on('data', (data) => {
                body += data.toString();
            });
            res.on('end', async () => {
                try {
                    const _repoSite = await getSiteSyncRepository();
                    const _repoZone = await getZoneSyncRepository();
                    const _repoPatient = await getPatientSyncRepository();
                    const _repoChws = await getChwsSyncRepository();

                    var jsonBody: any = JSON.parse(body).rows;
                    var len = jsonBody.length;
                    var done: number = 0;
                    var outDoneLenght: number = 0;

                    var authorized = {
                        site: req.body.site,
                        zone: req.body.zone,
                        patient: req.body.patient,
                        chw: req.body.chw
                    };

                    if (authorized.site) {
                        outDoneLenght++;
                        for (let i = 0; i < len; i++) {
                            done++;
                            const row: any = jsonBody[i];
                            if (row.doc.type === 'district_hospital') {
                                const siteId = row.doc._id;
                                if (siteId) {
                                    if (!outPutInfo.hasOwnProperty("Sites")) outPutInfo["Sites"] = { successCount: 0, errorCount: 0, errorElements: '', errorIds: '' };
                                    try {
                                        const _syncSite = new Sites();
                                         
                                        _syncSite.id = siteId;
                                        _syncSite.rev = row.doc._rev;
                                        _syncSite.name = row.doc.name;
                                        _syncSite.external_id = row.doc.external_id;
                                        _syncSite.reported_date = Functions.milisecond_to_date(row.doc.reported_date, 'dateOnly');
                                        _syncSite.reported_full_date = Functions.milisecond_to_date(row.doc.reported_date, 'fulldate');
                                        await _repoSite.save(_syncSite);
                                        outPutInfo["Sites"]["successCount"] += 1;
                                    } catch (err: any) {
                                        outPutInfo["Sites"]["errorCount"] += 1;
                                        outPutInfo["Sites"]["errorElements"] += `${_sepation}${err.toString()}`;
                                        outPutInfo["Sites"]["errorIds"] += `${_sepation}${siteId}`;
                                    }
                                }
                            }
                        }

                    }

                    if (authorized.zone) {
                        outDoneLenght++;
                        for (let i = 0; i < len; i++) {
                            done++;
                            const row: any = jsonBody[i];
                            if (row.doc.type === 'health_center' && row.doc.hasOwnProperty('parent')) {
                                const siteId = row.doc.parent._id;
                               
                                if (siteId ) {
                                    if (!outPutInfo.hasOwnProperty("Zones")) outPutInfo["Zones"] = { successCount: 0, errorCount: 0, errorElements: '', errorIds: '' };
                                    try {
                                        const _syncZone = new Zones();
                                        _syncZone.id = row.doc._id;
                                        _syncZone.rev = row.doc._rev;
                                        _syncZone.name = row.doc.name;
                                        _syncZone.external_id = row.doc.external_id;
                                        _syncZone.site = siteId;
                                        _syncZone.chw_id = row.doc.contact._id;
                                        _syncZone.reported_date = Functions.milisecond_to_date(row.doc.reported_date, 'dateOnly');
                                        _syncZone.reported_full_date = Functions.milisecond_to_date(row.doc.reported_date, 'fulldate');
                                        await _repoZone.save(_syncZone);
                                        outPutInfo["Zones"]["successCount"] += 1;
                                    } catch (err: any) {
                                        outPutInfo["Zones"]["errorCount"] += 1;
                                        outPutInfo["Zones"]["errorElements"] += `${_sepation}${err.toString()}`;
                                        outPutInfo["Zones"]["errorIds"] += `${_sepation}${row.doc._id}`;
                                    }
                                }
                            }
                        }

                    }

                   

                    if (authorized.patient) {
                        outDoneLenght++;
                        for (let i = 0; i < len; i++) {
                            done++;
                            const row: any = jsonBody[i];
                            if (row.doc.type === 'person' && row.doc.role === 'patient' && row.doc.hasOwnProperty('parent')) {
                                if (row.doc.parent.hasOwnProperty('parent')) {
                                    if (row.doc.parent.parent.hasOwnProperty('parent')) {
                                        const siteId = row.doc.parent.parent.parent._id;
                                       
                                        if (siteId) {
                                            if (!outPutInfo.hasOwnProperty("Patients")) outPutInfo["Patients"] = { successCount: 0, errorCount: 0, errorElements: '', errorIds: '', }
                                            try {
                                                const _syncPatient = new Patients();
                                                const sx = row.doc.sex;
                                                _syncPatient.id = row.doc._id;
                                                _syncPatient.rev = row.doc._rev;
                                                _syncPatient.name = row.doc.name;
                                                _syncPatient.external_id = row.doc.external_id;
                                                _syncPatient.role = row.doc.role;
                                                _syncPatient.date_of_birth = row.doc.date_of_birth;
                                                _syncPatient.sex = sx == 'male' ? 'M' : sx == 'female' ? 'F' : undefined;
                                                _syncPatient.reported_date = Functions.milisecond_to_date(row.doc.reported_date, 'dateOnly');
                                                _syncPatient.reported_full_date = Functions.milisecond_to_date(row.doc.reported_date, 'fulldate');
                                                _syncPatient.site = siteId;
                                                _syncPatient.zone = row.doc.parent.parent._id;
                                                await _repoPatient.save(_syncPatient);
                                                outPutInfo["Patients"]["successCount"] += 1;
                                            } catch (err: any) {
                                                outPutInfo["Patients"]["errorCount"] += 1;;
                                                outPutInfo["Patients"]["errorElements"] += `${_sepation}${err.toString()}`;
                                                outPutInfo["Patients"]["errorIds"] += `${_sepation}${row.doc._id}`;
                                                // console.log(row.doc._id)
                                            }
                                        }
                                    }
                                }
                            }
                        }

                    }

                    if (authorized.chw) {
                        outDoneLenght++;
                        for (let i = 0; i < len; i++) {
                            done++;
                            const row: any = jsonBody[i];
                            if (row.doc.type === 'person' && row.doc.role === 'chw' && row.doc.hasOwnProperty('parent')) {
                                if (row.doc.parent.hasOwnProperty('parent')) {
                                    const siteId = row.doc.parent.parent._id;
                                    
                                    if (siteId) {
                                        if (!outPutInfo.hasOwnProperty("Asc")) outPutInfo["Asc"] = { successCount: 0, errorCount: 0, errorElements: '', errorIds: '' };
                                        try {
                                            const _syncChws = new Chws();
                                            _syncChws.id = row.doc._id;
                                            _syncChws.rev = row.doc._rev;
                                            _syncChws.name = row.doc.name;
                                            _syncChws.external_id = row.doc.external_id;
                                            _syncChws.role = row.doc.role;
                                            _syncChws.reported_date = Functions.milisecond_to_date(row.doc.reported_date, 'dateOnly');
                                            _syncChws.reported_full_date = Functions.milisecond_to_date(row.doc.reported_date, 'fulldate');
                                            _syncChws.site = siteId;
                                            _syncChws.zone = row.doc.parent._id;
                                            await _repoChws.save(_syncChws);
                                            outPutInfo["Asc"]["successCount"] += 1;
                                        } catch (err: any) {
                                            outPutInfo["Asc"]["errorCount"] += 1;
                                            outPutInfo["Asc"]["errorElements"] += `${_sepation}${err.toString()}`;
                                            outPutInfo["Asc"]["errorIds"] += `${_sepation}${row.doc._id}`;
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // if (sync.use_SSL_verification !== true) NODE_TLS_REJECT_UNAUTHORIZED = undefined;
                    if (done === len * outDoneLenght) resp.status(200).json(outPutInfo);
                    // resp.status(200).json(outPutInfo);
                } catch (err: any) {
                    // NODE_TLS_REJECT_UNAUTHORIZED = undefined;
                    if (!err.statusCode) err.statusCode = 500;
                    outPutInfo["Message"] = {};
                    outPutInfo["Message"]["errorElements"] = err.message;
                    resp.status(err.statusCode).json(outPutInfo);
                }
            });
            process.on('uncaughtException', (err: any) => {
                if (!err.statusCode) err.statusCode = 500;
                outPutInfo["Message"] = {}
                outPutInfo["Message"]["errorElements"] = err.message;
                resp.status(err.statusCode).json(outPutInfo);
            });
            res.on('error', (err: any) => {
                if (!err.statusCode) err.statusCode = 500;
                outPutInfo["Message"] = {}
                outPutInfo["Message"]["errorElements"] = err.message;
                resp.status(err.statusCode).json(outPutInfo);
            });
        }).on('error', (err: any) => {
            if (!err.statusCode) err.statusCode = 500;
            outPutInfo["Message"] = {}
            outPutInfo["Message"]["errorElements"] = err.message;
            resp.status(err.statusCode).json(outPutInfo);
        });

    } catch (err: any) {
        if (!err.statusCode) err.statusCode = 500;
        outPutInfo["Message"] = {}
        outPutInfo["Message"]["errorElements"] = err.message;
        resp.status(err.statusCode).json(outPutInfo);
    }
}

