import { config } from 'dotenv';
config();

import express from 'express';
import { generateSafetyScoreFlow } from '../ai/flows/safety-score-generator';
import { detectAnomaliesInIncidentsFlow } from '../ai/flows/anomaly-detection-for-incidents';
import { touristAssistantFlow } from '../ai/flows/tourist-assistant';
import { blockchainRouter } from '../blockchain';

const app = express();
const port = parseInt(process.env.PORT || '3001', 10);

app.use(express.json());

// Endpoint for safety score generation
app.post('/generateSafetyScoreFlow', async (req, res) => {
  try {
    const result = await generateSafetyScoreFlow(req.body.data);
    res.json(result);
  } catch (error) {
    console.error('Error in generateSafetyScoreFlow:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint for anomaly detection
app.post('/detectAnomaliesInIncidentsFlow', async (req, res) => {
  try {
    const result = await detectAnomaliesInIncidentsFlow(req.body.data);
    res.json(result);
  } catch (error) {
    console.error('Error in detectAnomaliesInIncidentsFlow:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint for tourist assistant
app.post('/touristAssistantFlow', async (req, res) => {
  try {
    const result = await touristAssistantFlow(req.body.data);
    res.json(result);
  } catch (error) {
    console.error('Error in touristAssistantFlow:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Blockchain API routes
app.use('/api/blockchain', blockchainRouter);

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
