import { config } from 'dotenv';
config();

import express from 'express';
import cors from 'cors';
import http from 'http';
import { blockchainRouter } from './blockchain';
import locationRoutes from './routes/location.routes';
import { privacyRoutes } from './routes/privacy.routes';
import { geofenceRoutes } from './routes/geofence.routes';
import { generateSafetyScoreFlow } from './ai/flows/safety-score-generator';
import { detectAnomaliesInIncidentsFlow } from './ai/flows/anomaly-detection-for-incidents';
import { touristAssistantFlow } from './ai/flows/tourist-assistant';
import { initSocketServer } from './web-socket'; // Corrected import

const app = express();
const port = parseInt(process.env.PORT || '10000', 10);

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'https://new-safespot-1.onrender.com',
  'https://your-custom-domain.com' // Placeholder
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/blockchain', blockchainRouter);
app.use('/api/location', locationRoutes);
app.use('/api/privacy', privacyRoutes);
app.use('/api', geofenceRoutes);

// AI Flow endpoints using Genkit
app.post('/generateSafetyScoreFlow', async (req, res) => {
  try {
    console.log('Safety score request:', JSON.stringify(req.body, null, 2));
    const result = await generateSafetyScoreFlow(req.body);
    console.log('Safety score result:', result);
    res.json(result);
  } catch (error) {
    console.error('Error in generateSafetyScoreFlow:', error);
    res.status(500).json({ 
      safetyScore: -1, 
      explanation: 'Error generating safety score: ' + (error instanceof Error ? error.message : String(error))
    });
  }
});

app.post('/detectAnomaliesInIncidentsFlow', async (req, res) => {
  try {
    const result = await detectAnomaliesInIncidentsFlow(req.body);
    res.json(result);
  } catch (error) {
    console.error('Error in detectAnomaliesInIncidentsFlow:', error);
    res.status(500).json({ 
      isAnomalous: false, 
      anomalyExplanation: 'Error detecting anomalies: ' + (error instanceof Error ? error.message : String(error)),
      confidenceScore: 0.0 
    });
  }
});

app.post('/touristAssistantFlow', async (req, res) => {
  try {
    const result = await touristAssistantFlow(req.body);
    res.json(result);
  } catch (error) {
    console.error('Error in touristAssistantFlow:', error);
    res.status(500).json({ 
      intent: 'error', 
      responseText: 'Sorry, I encountered an error: ' + (error instanceof Error ? error.message : String(error)),
      isEmergency: false 
    });
  }
});

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = initSocketServer(server);

// Start server
server.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server listening at http://0.0.0.0:${port}`);
  console.log(`📋 Health check: http://0.0.0.0:${port}/health`);
  console.log(`🔗 Blockchain API: http://0.0.0.0:${port}/api/blockchain`);
});

export { io };