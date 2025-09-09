"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.server = void 0;
const socket_io_1 = require("socket.io");
const http_1 = __importDefault(require("http"));
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
exports.server = server;
const io = new socket_io_1.Server(server, {
    cors: {
        origin: true,
        methods: ["GET", "POST"],
        credentials: true
    }
});
exports.io = io;
const sosIncidents = new Map();
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    socket.on('SEND_SOS', (data) => {
        console.log('SOS Received:', data);
        const incidentId = `sos_${Date.now()}`;
        const incident = {
            id: incidentId,
            touristId: data.touristId,
            name: data.name,
            location: data.location,
            timestamp: new Date().toISOString(),
            message: data.message || "Emergency SOS triggered",
            status: 'active'
        };
        sosIncidents.set(incidentId, incident);
        console.log('Broadcasting NEW_SOS_INCIDENT:', incident);
        io.emit('NEW_SOS_INCIDENT', incident);
    });
    socket.on('ACKNOWLEDGE_SOS', (data) => {
        console.log('ACKNOWLEDGE_SOS received:', data);
        const incident = sosIncidents.get(data.incidentId);
        if (incident) {
            incident.status = 'acknowledged';
            incident.acknowledgedBy = data.adminId;
            incident.acknowledgedAt = new Date().toISOString();
            sosIncidents.set(data.incidentId, incident);
            console.log('Broadcasting SOS_ACKNOWLEDGED:', {
                incidentId: data.incidentId,
                acknowledgedBy: data.adminId
            });
            io.emit('SOS_ACKNOWLEDGED', {
                incidentId: data.incidentId,
                acknowledgedBy: data.adminId
            });
        }
        else {
            console.log('Incident not found:', data.incidentId);
        }
    });
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});
