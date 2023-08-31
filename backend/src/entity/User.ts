import * as jwt from 'jsonwebtoken';
import { notEmpty } from '../utils/functions';
import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert, DataSource, Repository } from "typeorm"
import * as bcrypt from 'bcryptjs';

import { AppDataSource } from '../data_source';
import { Roles } from '../utils/roles';

// export class User {
//     id!: string;
//     username!: string;
//     fullname!: string;
//     password!: string;
//     isSuperAdmin!: boolean;
//     roles!: string[];
//     groups!: string[];
//     isActive!: boolean;
//     expiresIn?: any;
//     usersession?: any;
//     defaultRedirectUrl!:string;
//     token!:string;
// }




@Entity("user", {
    orderBy: {
        username: "ASC",
        id: "DESC"
    }
})
export class User {
    constructor() { };
    @PrimaryGeneratedColumn()
    id!: string

    @Column({ unique: true, type: 'varchar' })
    username!: string

    @Column({ nullable: true })
    fullname!: string

    @Column({ unique: true, type: 'varchar', default: null })
    email!: string

    @Column()
    password!: string

    @Column({ nullable: false, default: '[guest]' })
    roles!: string

    @Column({ nullable: false, type: 'varchar', default: null })
    expiresIn!: string

    @Column({ nullable: false, type: 'varchar', default: null })
    defaultRedirectUrl!: string

    @Column({ nullable: false, type: 'varchar', default: null })
    token!: string

    @Column({ nullable: false, default: false })
    isActive!: boolean


}





export async function hashPassword(newPassword: string): Promise<string> {
    return await bcrypt.hash(newPassword, 12);
}

export async function comparePassword(oldPass: string, newPass: string) {
    return await bcrypt.compare(newPass, oldPass);
}

export function toResponseObject(user: User, showToken: boolean = true) {
    const { id, username, token } = user;
    const responseObject = { id, username, token };
    if (showToken) responseObject.token = token
    return responseObject;
}

let connection: DataSource;

export async function getUserRepository(): Promise<Repository<User>> {
    if (connection === undefined) connection = AppDataSource.manager.connection;
    return connection.getRepository(User);
}




export async function toMap(user: User) {
    return {
        id: user.id,
        username: user.username,
        fullname: user.fullname,
        roles: user.roles,
        isActive: user.isActive,
        expiresIn: user.expiresIn,
        token: await token(user),
        defaultRedirectUrl: user.defaultRedirectUrl
    }
}


export async function token(user: User) {
    return jwt.sign({ id: `${user.id}`, username: user.username, roles: user.roles, isActive: user.isActive }, (await jwSecretKey({ user: user })).secretOrPrivateKey, { expiresIn: `${(await jwSecretKey({ user: user })).expiredIn}s` });
}


export async function jwSecretKey(data: { userId?: string, user?: User }): Promise<{ expiredIn: string; secretOrPrivateKey: string; }> {
    var userIsChws: boolean = false;
    if (data.user) {
        userIsChws = Roles(data.user).isChws;
    } else if (notEmpty(data.userId)) {
        const _repoUser = await getUserRepository();
        const user = await _repoUser.findOneBy({id:data.userId!});
        if (user) {
            userIsChws = Roles(user).isChws;
        }
    }

    const second1 = 1000 * 60 * 60 * 24 * 366;
    const second2 = 1000 * 60 * 60 * 24 * 366;
    return {
        expiredIn: userIsChws ? `${second1}` : `${second2}`,
        secretOrPrivateKey: 'kossi-secretfortoken',
    }

}
