"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
const blockchain_1 = require("./blockchain");
const location_routes_1 = __importDefault(require("./routes/location.routes"));
const privacy_routes_1 = require("./routes/privacy.routes");
const geofence_routes_1 = require("./routes/geofence.routes");
const safety_score_generator_1 = require("./ai/flows/safety-score-generator");
const anomaly_detection_for_incidents_1 = require("./ai/flows/anomaly-detection-for-incidents");
const tourist_assistant_1 = require("./ai/flows/tourist-assistant");
const web_socket_1 = require("./web-socket");
const app = (0, express_1.default)();
const port = parseInt(process.env.PORT || '10000', 10);
const allowedOrigins = [
    'http://localhost:3000',
    'https://new-safespot-1.onrender.com',
    'https://your-custom-domain.com'
];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));
app.use(express_1.default.json());
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.use('/api/blockchain', blockchain_1.blockchainRouter);
app.use('/api/location', location_routes_1.default);
app.use('/api/privacy', privacy_routes_1.privacyRoutes);
app.use('/api', geofence_routes_1.geofenceRoutes);
app.post('/generateSafetyScoreFlow', async (req, res) => {
    try {
        console.log('Safety score request:', JSON.stringify(req.body, null, 2));
        const result = await (0, safety_score_generator_1.generateSafetyScoreFlow)(req.body);
        console.log('Safety score result:', result);
        res.json(result);
    }
    catch (error) {
        console.error('Error in generateSafetyScoreFlow:', error);
        res.status(500).json({
            safetyScore: -1,
            explanation: 'Error generating safety score: ' + (error instanceof Error ? error.message : String(error))
        });
    }
});
app.post('/detectAnomaliesInIncidentsFlow', async (req, res) => {
    try {
        const result = await (0, anomaly_detection_for_incidents_1.detectAnomaliesInIncidentsFlow)(req.body);
        res.json(result);
    }
    catch (error) {
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
        const result = await (0, tourist_assistant_1.touristAssistantFlow)(req.body);
        res.json(result);
    }
    catch (error) {
        console.error('Error in touristAssistantFlow:', error);
        res.status(500).json({
            intent: 'error',
            responseText: 'Sorry, I encountered an error: ' + (error instanceof Error ? error.message : String(error)),
            isEmergency: false
        });
    }
});
const server = http_1.default.createServer(app);
const io = (0, web_socket_1.initSocketServer)(server);
exports.io = io;
server.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Server listening at http://0.0.0.0:${port}`);
    console.log(`📋 Health check: http://0.0.0.0:${port}/health`);
    console.log(`🔗 Blockchain API: http://0.0.0.0:${port}/api/blockchain`);
});
