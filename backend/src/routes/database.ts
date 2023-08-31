import { body } from "express-validator";
import { deleteFromCouchDb, databaseEntitiesList, getChwDataToBeDeleteFromCouchDb, truncatePostgresMysqlJsonDatabase, updateUserFacilityIdAndContactPlace } from "../controllers/databaseUtils";
import { Middelware } from "../middleware/auth";

const express = require('express');
const databaseRouter = express.Router();


databaseRouter.post('/postgres/entities', Middelware.authMiddleware,databaseEntitiesList);

databaseRouter.post('/postgres/truncate',
[
  body('procide').isBoolean().not().isEmpty(),
  body('entities').isArray().not().isEmpty(),
], 
Middelware.authMiddleware,truncatePostgresMysqlJsonDatabase);

databaseRouter.post('/couchdb/update_user_facility_contact_place', Middelware.authMiddleware,updateUserFacilityIdAndContactPlace);

databaseRouter.post('/couchdb/list_data_to_delete', Middelware.authMiddleware,getChwDataToBeDeleteFromCouchDb);

databaseRouter.post('/couchdb/detele_data', Middelware.authMiddleware,deleteFromCouchDb);



export = databaseRouter;


