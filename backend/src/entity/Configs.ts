import { Entity, PrimaryGeneratedColumn, Column,Repository, DataSource, BeforeInsert } from "typeorm"
import { AppDataSource } from "../data_source"

@Entity()
export class Config {
    constructor(){};
    @PrimaryGeneratedColumn()
    id!: string

    @Column({ nullable: false, default: false })
    showRegisterPage!: boolean

}

let connection:DataSource;

export async function getConfigRepository(): Promise<Repository<Config>> {
  if (connection===undefined) connection =  AppDataSource.manager.connection;
  return connection.getRepository(Config);
}

