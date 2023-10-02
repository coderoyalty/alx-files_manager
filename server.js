import express from 'express';
import injectRoutes from './routes/index';

const app = express();

injectRoutes(app);

export default app
