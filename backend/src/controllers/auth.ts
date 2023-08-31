import { Request, Response, NextFunction } from 'express';
import { User, comparePassword, getUserRepository, hashPassword } from '../entity/User';
import { generateAuthSuccessData } from '../utils/functions';
import { UserValue } from '../utils/appInterface';
import { Roles } from '../utils/roles';

export class AuthController {


    static login = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const username = req.body.username;
            const password = req.body.password;

            if (username && password) {
                const repository = await getUserRepository();
                const userFound = await repository.findOneBy({ username: username });


                if (!userFound) {
                    return res.status(res.statusCode).json({ status: res.statusCode, data: 'No user found with this crediential, retry!' });
                } else {
                    if (userFound) {

                        if (userFound.isActive !== true && Roles(userFound).isSuperUser !== true) {
                            return res.status(res.statusCode).json({ status: res.statusCode, data: "You don't have permission to login!" });
                        }
                        const isEqual = await comparePassword(userFound.password,password);
                        if (!isEqual) {
                            return res.status(res.statusCode).json({ status: res.statusCode, data: 'Wrong password or Not Authorized !' });
                        }

                        var user: UserValue = await generateAuthSuccessData(userFound);

                        return res.status(res.statusCode).json({ status: 200, data: user });
                    } else {
                        return res.status(res.statusCode).json({ status: res.statusCode, data: 'No user found with this crediential, retry!' });
                    }
                }
            } else {

                if (!username) {
                    return res.status(res.statusCode).json({ status: res.statusCode, data: 'No username given' });
                } else if (!password) {
                    return res.status(res.statusCode).json({ status: res.statusCode, data: 'You not give password!' });
                } else {
                    return res.status(res.statusCode).json({ status: res.statusCode, data: 'crediential error' });
                }
            }
        }
        catch (err: any) {
            if (!err.statusCode) err.statusCode = 500;
            // next(err);
            // return res.status(err.statusCode).end();
            return res.status(err.statusCode).json({ status: err.statusCode, data: `${err}` });
        }
    }


    static register = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const repository = await getUserRepository();
            var user: any = {
                username: req.body.username,
                fullname: req.body.fullname,
                email: req.body.email,
                password: hashPassword(req.body.password),
            }
            const userFound = await repository.findOneBy({ username: user.username });
            if (userFound) {
                return res.status(res.statusCode).json({ status: res.statusCode, data: 'This Username is already used !' });
            }
            const result = await repository.save(user);
            return res.status(res.statusCode).json({ status: 200, data: result });
            // next();
        }
        catch (err: any) {
            if (!err.statusCode) err.statusCode = 500;
            // next(err);
            return res.status(err.statusCode).json({ status: err.statusCode, data: `${err}` });

        }
    }



}

