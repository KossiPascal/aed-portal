
import { body } from "express-validator";
import { AuthController } from "../controllers/auth";
import { Router} from 'express';
import { getUserRepository } from "../entity/User";

const authRouter = Router();

authRouter.post(
  '/register',
  [
    body('username')
    .trim().not().isEmpty().isString()
    .withMessage('Please enter username.')
    .custom(async (username) => {
      const repository = await getUserRepository();
      const user = await repository.findOneBy({ username: username });
      if (user) return Promise.reject('username already exist!');
    }),

    // body('email').isEmail()
    //   .withMessage('Please enter a valid email.')
    //   .custom(async (email) => {
    //     const repository = await getUserRepository();
    //     const user = await repository.findOneBy({ email: email });
    //     if (user) return Promise.reject('Email address already exist!');
    //   }).normalizeEmail(),

    body('password').trim().isLength({ min: 7 }),
  ],
  AuthController.register
);

authRouter.post('/login', AuthController.login);

export = authRouter;
