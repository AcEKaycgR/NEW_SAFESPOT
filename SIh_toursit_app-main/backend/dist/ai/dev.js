"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const express_1 = __importDefault(require("express"));
const safety_score_generator_1 = require("../ai/flows/safety-score-generator");
const anomaly_detection_for_incidents_1 = require("../ai/flows/anomaly-detection-for-incidents");
const tourist_assistant_1 = require("../ai/flows/tourist-assistant");
const blockchain_1 = require("../blockchain");
const app = (0, express_1.default)();
const port = parseInt(process.env.PORT || '3001', 10);
app.use(express_1.default.json());
app.post('/generateSafetyScoreFlow', async (req, res) => {
    try {
        const result = await (0, safety_score_generator_1.generateSafetyScoreFlow)(req.body.data);
        res.json(result);
    }
    catch (error) {
        console.error('Error in generateSafetyScoreFlow:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.post('/detectAnomaliesInIncidentsFlow', async (req, res) => {
    try {
        const result = await (0, anomaly_detection_for_incidents_1.detectAnomaliesInIncidentsFlow)(req.body.data);
        res.json(result);
    }
    catch (error) {
        console.error('Error in detectAnomaliesInIncidentsFlow:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.post('/touristAssistantFlow', async (req, res) => {
    try {
        const result = await (0, tourist_assistant_1.touristAssistantFlow)(req.body.data);
        res.json(result);
    }
    catch (error) {
        console.error('Error in touristAssistantFlow:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.use('/api/blockchain', blockchain_1.blockchainRouter);
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
