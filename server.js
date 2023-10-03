import express from 'express';
import injectRoutes from './routes/index';

const app = express();

injectRoutes(app);

app.listen(process.env.PORT || 5000);

export default app;

