// import "reflect-metadata"
import { DataSource } from "typeorm"
import path from "path";
import { Consts } from "./utils/constantes";
require('dotenv').config({ path: `${path.dirname(path.dirname(path.dirname(__dirname)))}/ssl/.aed-env` });

const { DB_HOST, DB_PORT, PROD_DB_NAME, DEV_DB_NAME, DB_USER, DB_PASS } = process.env

// const appdirname = Functions.appDirectory();
// `${appdirname}/ssl/server.key`

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: DB_HOST,
    // url: `postgres://kossi:kossi@123@${DB_HOST}:${DB_PORT}/${PROD_DB_NAME, DEV_DB_NAME}`,
    port: parseInt(`${DB_PORT}`),
    username: DB_USER,
    password: DB_PASS,
    database: Consts.isProdEnv ? PROD_DB_NAME : DEV_DB_NAME,
    synchronize: true,
    // logging: true,
    logging: ["query", "error"],
    // ssl:true,
    // entities: [__dirname + "/entity/*.ts"],
    entities: [__dirname + '/entity/*{.ts,.js}'],
    migrations: [__dirname + "/migration/*.sql"],
    migrationsTableName: "custom_migration_table",
    // subscribers: [__dirname + "/subscriber/*.ts"],
    subscribers: [__dirname + "/subscriber/*{.ts,.js}"],
    // replication:{ master: {}, slaves: [] }
    // dropSchema: false,
    // logger: 'advanced-console',
    
});

  
// export const AppDataSource = new DataSource({
//     type: "mysql",
//     host: "localhost",
//     port: 3306,
//     username: "kossi",
//     password: "kossi@123",
//     database: "ktsolegnagbo_postgres",
//     synchronize: true, 
//     logging: true,
//     entities: [__dirname + "/entity/*.ts"],
//     migrations: [__dirname + "/migration/*.sql"],
//     migrationsTableName: "custom_migration_table",
//     subscribers: [__dirname + "/subscriber/*.ts"],
//     // dropSchema: false,
// });


