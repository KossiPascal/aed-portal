import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { DataSource, EntityMetadata, In } from "typeorm";
import { AppDataSource } from "../data_source";
import { httpHeaders, sslFolder } from "../utils/functions";
import { getChwsDataSyncRepository, getChwsSyncRepository, getPatientSyncRepository } from "../entity/Sync";
import { getChwsDataWithParams } from "./dataFromDB";
import { getPatients } from "./orgUnitsFromDB ";
import { Consts } from "../utils/constantes";
const request = require('request');
// const axios = require('axios');
// const fetch = require('node-fetch')
require('dotenv').config({ path: sslFolder('.aed-env') });
const { CHT_HOST, PROD_CHT_PORT, DEV_CHT_PORT } = process.env;

export async function databaseEntitiesList(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(201).json({ status: 201, data: 'Informations you provided are not valid' });
    try {
        const Connection: DataSource = AppDataSource.manager.connection;
        const entities: EntityMetadata[] = Connection.entityMetadatas;
        var entitiesElements: { name: string, table: string }[] = [];
        for (const entity of entities) {
            entitiesElements.push({ name: entity.name, table: entity.tableName })
        }
        return res.status(200).json({ status: 200, data: entitiesElements });
    } catch (err) {
        // return next(err);
        return res.status(201).json({ status: 201, data: err });
    }
};


export async function truncatePostgresMysqlJsonDatabase(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(201).json({ status: 201, data: 'Informations you provided are not valid' });
    if (req.body.procide == true) {
        try {
            const Connection: DataSource = AppDataSource.manager.connection;
            const entities: { name: string, table: string }[] = req.body.entities;
            for (const entity of entities) {
                const repository = await Connection.getRepository(entity.name);
                await repository.query(`TRUNCATE ${entity.table} RESTART IDENTITY CASCADE;`);
            }
            return res.status(200).json({ status: 200, data: 'Done successfully' });
        } catch (err) {
            // return next(err);
            return res.status(201).json({ status: 201, data: err });
        }
    } else {
        return res.status(201).json({ status: 201, data: "You don't have permission de procide action" });
    }
};

export async function getChwDataToBeDeleteFromCouchDb(req: Request, resp: Response, next: NextFunction) {

    var reqSource = req.body.sources;
    var reqDist = req.body.districts;
    var reqSite = req.body.sites;
    var reqZone = req.body.zones;
    var reqChw = req.body.chws;
    var reqType = req.body.type;

    if (reqSource && reqDist && reqSite && reqZone && reqChw && reqType) {
        var errorMsg = { status: 201, data: 'Error fond when fetching data! ' };
        try {
            if (reqType == 'data') {
                await getChwsDataWithParams(req, resp, next);
            } else if (reqType == 'patients') {
                await getPatients(req, resp, next)
            }
        } catch (error) {
            return resp.status(201).json(errorMsg)
        }
    } else {
        return resp.status(resp.statusCode).json({ status: 200, data: "You dont'provide a valide parametters" })
    }
   
}

export async function deleteFromCouchDb(req: Request, res: Response, next: NextFunction) {
    var todelete: { _deleted: boolean, _id: string, _rev: string }[] = req.body.array_data_to_delete;
    var reqType = req.body.type;
    var allIds: string[] = [];

    for (let i = 0; i < todelete.length; i++) {
        const ids = todelete[i];
        allIds.push(ids._id);
    }

    if (todelete.length > 0 && allIds.length > 0 && reqType) {
        request({
            url: `https://${CHT_HOST}:${Consts.isProdEnv ? PROD_CHT_PORT : DEV_CHT_PORT}/medic/_bulk_docs`,
            method: 'POST',
            body: JSON.stringify({ "docs": todelete }),
            headers: httpHeaders()
        }, async function (err: any, response: any, body: any) {
            if (err) {
                return res.status(201).json({ status: 201, data: err });
            } else {

                if (reqType == 'data') {
                    const _repoData = await getChwsDataSyncRepository();
                    _repoData.delete({ id: In(allIds) });
                } else if (reqType == 'patients') {
                    const _repoPatient = await getPatientSyncRepository();
                    _repoPatient.delete({ id: In(allIds) });
                }

                return res.status(200).json({ status: 200, data: body })
            }

        });
    } else {
        return res.status(201).json({ status: 201, data: 'No Data Provided' });
    }
}



async function updateChws(chwId: string, data: any) {
    try {
        const _repoChws = await getChwsSyncRepository();
        const chwUpdated = await _repoChws.update({ id: chwId, }, data);
        return true;
    } catch (err: any) {
        return false;
    }
}

export async function updateUserFacilityIdAndContactPlace(req: Request, res: Response, next: NextFunction) {

    // const req_params: ChwUserParams = req.body;

    request({
        url: `https://${CHT_HOST}:${Consts.isProdEnv ? PROD_CHT_PORT : DEV_CHT_PORT}/api/v1/users`,
        method: 'GET',
        headers: httpHeaders()
    }, function (error: any, response: any, body: any) {
        if (error) return res.status(201).json({ status: 201, message: 'Error Found!' });

        try {
            const users = JSON.parse(body);

            var dataFound: string[] = [];

            for (let i = 0; i < users.length; i++) {
                const user = users[i];

                if (user.type == "chw") {
                    if (user.hasOwnProperty('contact')) {
                        if (user.contact.hasOwnProperty('_id')) {
                            if (user.place._id === req.body.parent && user.contact._id === req.body.contact && user.contact.role === "chw") {
                                dataFound.push('OK');

                                // start updating facility_id
                                return request({
                                    url: `https://${CHT_HOST}:${Consts.isProdEnv ? PROD_CHT_PORT : DEV_CHT_PORT}/api/v1/users/${user.username}`,
                                    method: 'POST',
                                    body: JSON.stringify({ "place": req.body.new_parent }),
                                    headers: httpHeaders()
                                }, function (error: any, response: any, body: any) {
                                    if (error) return res.status(201).json({ status: 201, message: 'Error Found!' });

                                    request({
                                        url: `https://${CHT_HOST}:${Consts.isProdEnv ? PROD_CHT_PORT : DEV_CHT_PORT}/medic/${req.body.contact}`,
                                        method: 'GET',
                                        headers: httpHeaders()
                                    }, function (error: any, response: any, body: any) {
                                        try {
                                            if (error) return res.status(201).json({ status: 201, message: 'Error Found!' });
                                            const data = JSON.parse(body);
                                            data.parent._id = req.body.new_parent;

                                            // start updating Contact Place Informations
                                            request({
                                                url: `https://${CHT_HOST}:${Consts.isProdEnv ? PROD_CHT_PORT : DEV_CHT_PORT}/api/v1/people`,
                                                method: 'POST',
                                                body: JSON.stringify(data),
                                                headers: httpHeaders()
                                            }, async function (error: any, response: any, body: any) {
                                                try {
                                                    if (error) return res.status(201).json({ status: 201, message: 'Error Found!' });
                                                    const update = await updateChws(req.body.contact, { zone: req.body.new_parent });
                                                    if (update) {
                                                        return res.status(200).json({ status: 200, message: "Vous avez changé la zone de l'ASC avec succes!" });
                                                    } else {
                                                        return res.status(201).json({ status: 201, message: "Erruer trouvée, Contacter immédiatement l'administrateur!" });
                                                    }
                                                } catch (err: any) {
                                                    return res.status(201).json({ status: 201, message: err.toString() });
                                                }
                                            });
                                        } catch (err: any) {
                                            return res.status(201).json({ status: 201, message: err.toString() });
                                        }
                                    });
                                });
                            }
                        }
                    }
                }
            }

            if (dataFound.length <= 0) return res.status(201).json({ status: 201, message: "Pas d'ASC trouvé pour procéder à l'opération, Réessayer !" });
        } catch (err: any) {
            return res.status(201).json({ status: 201, message: err.toString() });
        }

    });
}


