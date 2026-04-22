import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import usersRouter from "./routes/users";
import tasksRouter from "./routes/tasks";
import rewardsRouter from "./routes/rewards";
import lotteryRouter from "./routes/lottery";
import parentRouter from "./routes/parent";
import pointsRouter from "./routes/points";

const app = express();
const port = process.env.PORT || 9091;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check
app.get('/api/v1/health', (req, res) => {
  console.log('Health check success');
  res.status(200).json({ status: 'ok' });
});

// Register routes
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/tasks', tasksRouter);
app.use('/api/v1/rewards', rewardsRouter);
app.use('/api/v1/lottery', lotteryRouter);
app.use('/api/v1/parent', parentRouter);
app.use('/api/v1/points', pointsRouter);

// Serve static files (frontend)
const publicPath = path.join(__dirname, '../../client/dist');
app.use(express.static(publicPath));

// SPA fallback - for any non-API route, serve index.html
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(publicPath, 'index.html'), (err) => {
    if (err) {
      res.status(500).send(err);
    }
  });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}/`);
});
