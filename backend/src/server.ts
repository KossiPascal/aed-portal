import "reflect-metadata"
import express from 'express';
import { json, urlencoded } from 'body-parser';
import { Functions, logNginx, projectFolder, sslFolder } from './utils/functions';
import { AppDataSource } from './data_source';
import cors from "cors";
import bearerToken from "express-bearer-token";
import { Errors } from "./routes/error";
import authRouter from "./routes/auth";
import configRouter from "./routes/config";
import userRouter from "./routes/user";
import fs from "fs";
import databaseRouter from "./routes/database";
import { AutoSyncDataFromCloud } from "./controllers/auto_server_sync";
import { Consts } from "./utils/constantes";
const path = require('path');
const cron = require("node-cron");
const compression = require("compression");
const responseTime = require('response-time')

require('dotenv').config({ path: sslFolder('.aed-env') });
const { ACCESS_ALL_AVAILABE_PORT,CAN_ACCESS_INSECURE, PROD_PORT, PROD_PORT_SECURED, DEV_PORT, DEV_PORT_SECURED } = process.env


const hostnames = Functions.getIPAddress(ACCESS_ALL_AVAILABE_PORT == 'true');
const port = Functions.normalizePort((Consts.isProdEnv ? PROD_PORT : DEV_PORT) || Consts.defaultPort);
const portSecured = Functions.normalizePort((Consts.isProdEnv ? PROD_PORT_SECURED : DEV_PORT_SECURED) || Consts.defaultSecurePort);

// const cookieParser = require('cookie-parser')
var session = require('express-session');

AppDataSource
  .initialize()
  .then(async () => {
    console.log("initialize success !");
    logNginx("initialize success !");
    console.log(`App Version: ${Functions.appVersion()}`);
    logNginx(`App Version: ${Functions.appVersion()}`);
  })
  .catch(error => {console.log(`${error}`); logNginx(`${error}`)});

const app = express()
  .use(cors())
  .use(json())
  .use(responseTime())
  .use(compression())
  .use(urlencoded({ extended: false }))
  .enable('trust proxy')
  .set('trust proxy', 1)
  .set("view engine", "ejs")
  .set('json spaces', 2)
  .set('content-type', 'application/json; charset=utf-8')
  .use(session({
    secret: 'session',
    cookie: {
      secure: true,
      maxAge: 60000
    },
    // store: new RedisStore(),
    saveUninitialized: true,
    resave: true
  }))
  .use(bearerToken())
  .use('/api/auth', authRouter)
  .use('/api/user', userRouter)
  .use('/api/configs', configRouter)
  .use('/api/database', databaseRouter)

  .use('/api/assets', express.static(__dirname + '/assets'))
  .use(express.static(path.join(projectFolder(), "views")))
  .use("/", (req, res) => res.sendFile(path.join(projectFolder(), "views/index.html")))
  .all('*', (req, res) => res.status(200).redirect("/"))
  .use(Errors.get404)
  .use(Errors.get500);

const appSecured = app;
const credentials = {
  key: fs.readFileSync(`${sslFolder('server.key')}`, 'utf8'),
  ca: fs.readFileSync(`${sslFolder('server-ca.crt')}`, 'utf8'),
  cert: fs.readFileSync(`${sslFolder('server.crt')}`, 'utf8')
};

app.set('port', port);
appSecured.set('port', portSecured);

/* Redirect http to https */
appSecured.use((req, res, next) => {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.secure) next();
  if (!req.secure) res.redirect(`https://${req.headers.host}${req.url}`);
})

// //  ┌────────────── second (0 - 59) (optional)
// //  │ ┌──────────── minute (0 - 59) 
// //  │ │ ┌────────── hour (0 - 23)
// //  │ │ │ ┌──────── day of the month (1 - 31)
// //  │ │ │ │ ┌────── month (1 - 12)
// //  │ │ │ │ │ ┌──── day of the week (0 - 6) (0 and 7 both represent Sunday)
// //  │ │ │ │ │ │
// //  │ │ │ │ │ │
// //  * * * * * * 
// cron.schedule("00 59 23 * * *", function () {
//   const msg = `running this task every 23h 59 min 0 seconds.`;
//   console.log(msg);
//   logNginx(msg);
//   AutoSyncDataFromCloud();
// });

// uploadData();

if (CAN_ACCESS_INSECURE == 'true') {
  Functions.ServerStart({ isSecure: false, app: app, access_ports: ACCESS_ALL_AVAILABE_PORT == 'true', port: port, hostnames: hostnames })
}
Functions.ServerStart({ isSecure: true, credential: credentials, app: appSecured, access_ports: ACCESS_ALL_AVAILABE_PORT == 'true', port: portSecured, hostnames: hostnames })

