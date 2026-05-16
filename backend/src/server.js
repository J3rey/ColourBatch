import cors from 'cors';
import 'dotenv/config';
import express from 'express';

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://127.0.0.1:5173' }));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_request, response) => {
  response.json({
    ok: true,
    service: 'colourbatch-api',
    version: '0.1.0',
  });
});

app.get('/api/app', (_request, response) => {
  response.json({
    name: 'ColourBatch',
    status: 'ready',
  });
});

app.use((_request, response) => {
  response.status(404).json({ error: 'Not found' });
});

app.listen(port, '127.0.0.1', () => {
  console.log(`ColourBatch API listening on http://127.0.0.1:${port}`);
});
