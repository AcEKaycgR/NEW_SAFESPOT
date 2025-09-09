"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ai = void 0;
const genkit_1 = require("genkit");
const googleai_1 = require("@genkit-ai/googleai");
if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY environment variable is not set!');
    throw new Error('GEMINI_API_KEY environment variable is required for Genkit GoogleAI plugin');
}
exports.ai = (0, genkit_1.genkit)({
    plugins: [(0, googleai_1.googleAI)({
            apiKey: process.env.GEMINI_API_KEY
        })],
    model: 'googleai/gemini-2.5-flash',
});
