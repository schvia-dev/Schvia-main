
import express from 'express';
import { config } from './config';
import { pool } from './db';
import appRoutes from './routes/App/index';
import webRoutes from './routes/Web/index';

const app = express();
app.use(express.json());

app.use('/app', appRoutes);   // For Mobile App
app.use('/web', webRoutes);  // For React Web App

app.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
});
