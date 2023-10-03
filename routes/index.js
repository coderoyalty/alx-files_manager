import express from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';

const injectRoutes = (api) => {
  api.use(express.urlencoded({ extended: true }));
  api.use(express.json());

  api.get('/status', AppController.getStatus);
  api.get('/stats', AppController.getStats);

  api.post('/users', UsersController.postNew);

  api.get('/connect', AuthController.getConnect);
  api.get('/disconnect', AuthController.getDisconnect);
  api.get('/users/me', UsersController.getMe);
};

export default injectRoutes;
