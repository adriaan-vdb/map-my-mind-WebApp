import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mapsRouter from './routes';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/maps', mapsRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
}); 