import { Express } from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController'

const injectRoutes = (api) => {
  api.get('/status', AppController.getStatus);
  api.get('stats', AppController.getStats);

  api.get('/connect', AuthController.getConnect);
  api.get('/disconnect', UsersController.getMe);
  api.post('/users', UsersController.postNew);
};

export default injectRoutes;
