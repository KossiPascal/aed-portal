

import { Entity, Column, Repository, DataSource, PrimaryColumn, JoinColumn, ManyToOne, Unique, Index } from "typeorm"
import { AppDataSource } from "../data_source"

let Connection: DataSource = AppDataSource.manager.connection;


@Entity()
export class Sites {
  constructor() { };
  @PrimaryColumn({ type: 'varchar' })
  id?: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  rev?: string

  @Column({ type: 'varchar', nullable: true })
  name?: string

  @Column({ type: 'varchar', nullable: true })
  external_id?: string

  @Column({ type: 'varchar', nullable: true })
  reported_date?: string

  @Column({ type: 'varchar', nullable: true })
  reported_full_date?: string

}
export async function getSiteSyncRepository(): Promise<Repository<Sites>> {
  return Connection.getRepository(Sites);
}

// ##################################################################

@Entity()
export class Zones {
  constructor() { };
  @PrimaryColumn({ type: 'varchar', length: 255, nullable: false })
  id?: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  rev?: string

  @Column({ type: 'varchar', nullable: true })
  name?: string

  @Column({ type: 'varchar', nullable: true })
  external_id?: string

  @ManyToOne(() => Sites, (site) => site.id, { eager: true, nullable: true, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'site_id', referencedColumnName: 'id' })
  site!: Sites|null

  @Column({ type: 'varchar', nullable: true })
  chw_id?: string

  @Column({ type: 'varchar', nullable: true })
  reported_date?: string

  @Column({ type: 'varchar', nullable: true })
  reported_full_date?: string
}
export async function getZoneSyncRepository(): Promise<Repository<Zones>> {
  return Connection.getRepository(Zones);
}


// ##################################################################

@Entity()
export class Patients {
  constructor() {}
  @PrimaryColumn({ type: 'varchar', length: 255, nullable: false })
  id?: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  rev?: string

  @Column({ type: 'varchar', nullable: true })
  name?: string

  @Column({ type: 'varchar', nullable: true })
  external_id?: string

  @Column({ type: 'varchar', nullable: true })
  role?: string

  @Column({ type: 'varchar', nullable: true })
  sex?: string

  @Column({ type: 'varchar', nullable: true })
  date_of_birth?: string

  @ManyToOne(() => Sites, site => site.id, { eager: true, nullable: true, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'site_id', referencedColumnName: 'id' })
  site!: Sites|null

  @ManyToOne(() => Zones, zone => zone.id, { eager: true, nullable: true, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'zone_id', referencedColumnName: 'id' })
  zone!: Zones|null
  
  @Column({ type: 'varchar', nullable: true })
  reported_date?: string

  @Column({ type: 'varchar', nullable: true })
  reported_full_date?: string
}
export async function getPatientSyncRepository(): Promise<Repository<Patients>> {
  return Connection.getRepository(Patients);
}

// ##################################################################

@Entity()
@Unique(['external_id'])
export class Chws {
  constructor() { };
  @PrimaryColumn({ type: 'varchar', length: 255, nullable: false })
  id?: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  rev?: string

  @Column({ type: 'varchar', nullable: true })
  name?: string

  @Column({ type: 'varchar', nullable: true })
  @Index({ unique: true })
  external_id?: string

  @Column({ type: 'varchar', nullable: true })
  role?: string

  @ManyToOne(() => Sites, site => site.id, { eager: true, nullable: true, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'site_id', referencedColumnName: 'id' })
  site!: Sites|null

  @ManyToOne(() => Zones, zone => zone.id, { eager: true, nullable: true, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'zone_id', referencedColumnName: 'id' })
  zone!: Zones|null

  @Column({ type: 'varchar', nullable: true })
  reported_date?: string

  @Column({ type: 'varchar', nullable: true })
  reported_full_date?: string
}
export async function getChwsSyncRepository(): Promise<Repository<Chws>> {
  return Connection.getRepository(Chws);
}


// ##################################################################



@Entity()
export class ChwsData {
  constructor() { };
  @PrimaryColumn({ type: 'varchar', length: 255, nullable: false })
  id!: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  rev?: string

  @Column({ type: 'varchar', nullable: true })
  source?: string

  @Column({ type: 'varchar', default: '', nullable: true })
  form?: string

  @Column('json', { nullable: true })
  fields?: any;

  @ManyToOne(() => Sites, site => site.id, { eager: true, nullable: true, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'site_id', referencedColumnName: 'id' })
  site!: Sites

  @ManyToOne(() => Zones, zone => zone.id, { eager: true, nullable: true, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'zone_id', referencedColumnName: 'id' })
  zone!: Zones

  @ManyToOne(() => Chws, chw => chw.id, { eager: true, nullable: true, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'chw_id', referencedColumnName: 'id' })
  chw!: Chws

  @Column({ type: 'varchar', nullable: true })
  family_id?: string

  @Column({ type: 'varchar', nullable: true })
  patient_id?: string

  @Column({ type: 'varchar', nullable: true })
  phone?: string

  @Column({ type: 'varchar', nullable: true })
  reported_date!: string

  @Column({ type: 'varchar', nullable: true })
  reported_full_date?: string

  @Column('json', { nullable: true })
  geolocation?: object;

}
export async function getChwsDataSyncRepository(): Promise<Repository<ChwsData>> {
  return Connection.getRepository(ChwsData);
}

