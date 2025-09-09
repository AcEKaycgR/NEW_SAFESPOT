"use strict";
'use server';
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectAnomaliesInIncidentsFlow = void 0;
exports.detectAnomaliesInIncidents = detectAnomaliesInIncidents;
const genkit_1 = require("../genkit");
const genkit_2 = require("genkit");
const DetectAnomaliesInIncidentsInputSchema = genkit_2.z.object({
    incidentReport: genkit_2.z.string().describe('The incident report text, which could be from a tourist or an observer.'),
    locationHistory: genkit_2.z.array(genkit_2.z.object({
        latitude: genkit_2.z.number(),
        longitude: genkit_2.z.number(),
        timestamp: genkit_2.z.string().describe("ISO 8601 timestamp"),
    })).optional().describe("The tourist's recent location history, if available."),
    itinerary: genkit_2.z.string().optional().describe("The tourist's planned itinerary."),
});
const DetectAnomaliesInIncidentsOutputSchema = genkit_2.z.object({
    isAnomalous: genkit_2.z.boolean().describe('Whether the incident report is anomalous.'),
    anomalyExplanation: genkit_2.z
        .string()
        .describe('Explanation of why the incident report is considered anomalous, considering the report text, location patterns, and itinerary deviations.'),
    confidenceScore: genkit_2.z.number().describe("A confidence score (0-1) indicating the likelihood that this is a true anomaly."),
});
async function detectAnomaliesInIncidents(input) {
    return (0, exports.detectAnomaliesInIncidentsFlow)(input);
}
const prompt = genkit_1.ai.definePrompt({
    name: 'detectAnomaliesInIncidentsPrompt',
    input: { schema: DetectAnomaliesInIncidentsInputSchema },
    output: { schema: DetectAnomaliesInIncidentsOutputSchema },
    prompt: `You are an expert AI anomaly detection system for a tourist safety application.

Your task is to analyze an incident report and associated data to determine if it represents a genuine anomaly requiring attention.
Anomalous incidents are those that are unusual, unexpected, or deviate significantly from typical tourist patterns.

Consider the following inputs:
1.  **Incident Report Text:** The description of the event.
2.  **Location History:** The tourist's recent movements. Look for sudden stops, rapid unexplained travel, or entry into known high-risk areas. A prolonged lack of movement in a place that is not a hotel or restaurant could be a sign of trouble.
3.  **Planned Itinerary:** Compare the location of the incident with the tourist's stated plans. A significant deviation is a potential red flag.

Incident Report:
"{{{incidentReport}}}"

{{#if locationHistory}}
Recent Location History:
{{#each locationHistory}}
- Lat: {{latitude}}, Lon: {{longitude}} at {{timestamp}}
{{/each}}
{{/if}}

{{#if itinerary}}
Planned Itinerary: {{{itinerary}}}
{{/if}}

Based on all available information, determine if the incident is anomalous. Provide a clear explanation for your conclusion and a confidence score from 0.0 to 1.0. For example, a text-only report might have lower confidence than a report corroborated by a sudden deviation from the itinerary.`,
});
exports.detectAnomaliesInIncidentsFlow = genkit_1.ai.defineFlow({
    name: 'detectAnomaliesInIncidentsFlow',
    inputSchema: DetectAnomaliesInIncidentsInputSchema,
    outputSchema: DetectAnomaliesInIncidentsOutputSchema,
}, async (input) => {
    const { output } = await prompt(input);
    return output;
});
