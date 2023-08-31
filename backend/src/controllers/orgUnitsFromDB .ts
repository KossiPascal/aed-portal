import { NextFunction, Request, Response } from "express";
import { validationResult } from 'express-validator';
// import https = require('https');
import { Between, Equal, In } from "typeorm";
// const request = require('request');

import { Sites, getSiteSyncRepository, getPatientSyncRepository, Patients, getChwsSyncRepository, Chws, getZoneSyncRepository, Zones, } from "../entity/Sync";
import { notEmpty } from "../utils/functions";





export async function getSites(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(201).json({ status: 201, data: 'Informations you provided are not valid' });
    try {
        const repository = await getSiteSyncRepository();
        var sites: Sites[] = await repository.find({
            where: {
                id: notEmpty(req.body.id) ? req.body.id : undefined,
            }
        });
        if (!sites) return res.status(201).json({ status: 201, data: 'No Data Found !' });
        return res.status(200).json({ status: 200, data: sites });
    } catch (err) {
        // return next(err);
        return res.status(201).json({ status: 201, data: err });
    }
};

export async function getZones(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(201).json({ status: 201, data: 'Informations you provided are not valid' });
    try {
        const repository = await getZoneSyncRepository();
        var zones: Zones[] = await repository.find({
            where: {
                id: notEmpty(req.body.id) ? req.body.id : undefined,
                site: notEmpty(req.body.sites) ? { id: In(req.body.sites) } : undefined,
                chw_id: notEmpty(req.body.chws) ? In(req.body.chws) : undefined,
            }
        });
        if (!zones) return res.status(201).json({ status: 201, data: 'No Data Found !' });
        return res.status(200).json({ status: 200, data: zones });
    }
    catch (err) {
        // return next(err);
        return res.status(200).json({ status: 500, data: err });
    }
};

export async function getChws(req: Request, res: Response, next: NextFunction, onlyData:boolean = false):Promise<any> {
    var respData:{ status: number, data: any };
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        respData = { status: 201, data: 'Informations you provided are not valid' }
        return onlyData ? respData : res.status(201).json(respData);
    }
    try {
        const _chwRepo = await getChwsSyncRepository();
        const userId: string = req.body.userId;
        var chws: Chws[] = await _chwRepo.find({
            where: {
                id: notEmpty(req.body.id) ? req.body.id : undefined,
                site: notEmpty(req.body.sites) ? { id: In(req.body.sites) } : undefined,
                zone: {
                    id: notEmpty(req.body.zones) ? In(req.body.zones) : undefined,
                    chw_id: notEmpty(req.body.chws) ? In(req.body.chws) : undefined,
                },
            },
        });
        respData = !chws ? { status: 201, data: 'No Data Found !' } : { status: 200, data: chws }
    } catch (err) {
        // return next(err);
        respData = { status: 201, data: err };
    }
    return onlyData ? respData : res.status(respData.status).json(respData);
};


export async function getPatients(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(201).json({ status: 201, data: 'Informations you provided are not valid' });
    try {
        const repository = await getPatientSyncRepository();
        var patients: Patients[] = await repository.find({
            where: {
                id: notEmpty(req.body.id) ? req.body.id : undefined,
                site: notEmpty(req.body.sites) ? { id: In(req.body.sites) } : undefined,
                zone: {
                    id: notEmpty(req.body.zones) ? In(req.body.zones) : undefined,
                    chw_id: notEmpty(req.body.chws) ? In(req.body.chws) : undefined,
                },
            }
        });
        if (!patients) return res.status(201).json({ status: 201, data: 'No Data Found !' });
        return res.status(200).json({ status: 200, data: patients });
    }
    catch (err) {
        // return next(err);
        return res.status(201).json({ status: 201, data: err });
    }
};

export async function deleteOrgUnits(req: Request, res: Response, next: NextFunction) { }

