import { NextFunction, Request, Response, Router } from 'express';
import { User, getUserRepository } from '../entity/User';
import { Functions, generateUserMapData } from '../utils/functions';
import { JsonDatabase } from '../json-data-source';

const configRouter = Router();

configRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const _repoConfig = new JsonDatabase('configs');
    const found = (Object.values(_repoConfig.all()))[0];
    // const _repoConfig = await getConfigRepository();
    // const found = (await _repoConfig.find())[0];
    return res.status(res.statusCode).json(found);
  }
  catch (err: any) {
    if (!err.statusCode) err.statusCode = 500;
    return res.status(err.statusCode).end();
  }

});

configRouter.post('/appVersion', async (req: Request, res: Response, next: NextFunction) => {
  try {
    return res.status(200).json(Functions.appVersion());
  }
  catch (err: any) {
    return res.status(500).end();
  }
});

configRouter.post('/newToken', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.body.userId;


    try {
      const repo = await getUserRepository();
      const user = await repo.findOneBy({ id: userId });
      if (user) {
        if (user.isActive !== true) {
          return res.status(201).json({ status: 201, data: "You don't have permission to login!" });
        }

        const userData = await generateUserMapData(user);
        repo.update({ id: user.id, }, userData);

        return res.status(200).json({ status: 200, data: userData });
      } else {
        return res.status(201).json({ status: 201, data: 'No user found, retry!' });

      }

    }
    catch (err: any) {
      return res.status(201).json({ status: 201, data: `${err}` });
    }

  }
  catch (err: any) {
    // if (!err.statusCode) err.statusCode = 500;
    return res.status(201).json({ status: 201, data: err });
  }
});



export = configRouter;
