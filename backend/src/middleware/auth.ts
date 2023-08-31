import { Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import { jwSecretKey } from "../entity/User";

export class Middelware {
  static authMiddleware = async (req: Request, res: Response, next: any) => {

    if (req.body.privileges == true) return next();
    const authHeader = req.get('Authorization');
    if (!authHeader) return res.status(res.statusCode).send('Not authenticated!');
    const token = authHeader.split(' ')[1];
    const userId = req.body.userId;
    jwt.verify(token, (await jwSecretKey({userId:userId})).secretOrPrivateKey, function (err, decoded) {
      return err ? res.status(res.statusCode).send(err) : next();
    });
  };
}
