"use strict";
'use server';
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSafetyScoreFlow = void 0;
exports.generateSafetyScore = generateSafetyScore;
const genkit_1 = require("@/ai/genkit");
const genkit_2 = require("genkit");
const LocationPointSchema = genkit_2.z.object({
    latitude: genkit_2.z.number(),
    longitude: genkit_2.z.number(),
    timestamp: genkit_2.z.string().describe("ISO 8601 timestamp"),
});
const SafetyScoreInputSchema = genkit_2.z.object({
    currentLocation: LocationPointSchema,
    locationHistory: genkit_2.z.array(LocationPointSchema).describe("Recent location history of the tourist."),
    itinerary: genkit_2.z.string().optional().describe("The tourist's planned itinerary for the day or trip. E.g., 'Morning: Gateway of India, Afternoon: Marine Drive'"),
    time: genkit_2.z.string().describe('The current time.'),
    region: genkit_2.z.string().describe('The region of the location.'),
});
const SafetyScoreOutputSchema = genkit_2.z.object({
    safetyScore: genkit_2.z
        .number()
        .describe('A safety score between 0 and 100, where 0 is the least safe and 100 is the safest.'),
    explanation: genkit_2.z
        .string()
        .describe('An explanation of the safety score based on available data, including factors like time of day, location risk, and deviation from itinerary.'),
});
async function generateSafetyScore(input) {
    return (0, exports.generateSafetyScoreFlow)(input);
}
const prompt = genkit_1.ai.definePrompt({
    name: 'safetyScorePrompt',
    input: { schema: SafetyScoreInputSchema },
    output: { schema: SafetyScoreOutputSchema },
    prompt: `You are a sophisticated AI safety analyst for a tourist safety application.

You will receive the tourist's current location, recent location history, their planned itinerary, and the current time and region.
Based on this information, you will generate a safety score between 0 and 100, where 0 is the least safe and 100 is the safest.

Your analysis MUST consider the following factors:
1.  **Geographic Risk:** The inherent safety of the current location (e.g., 'Marine Drive' vs. a known high-crime area) at the given time of day.
2.  **Time of Day:** Safety can change drastically at night.
3.  **Itinerary Deviation:** Is the tourist's current location significantly far from their planned itinerary? A large, unexplained deviation could indicate a problem.
4.  **Movement Patterns:** Analyze the location history. Is the movement logical for a tourist, or is it erratic? Is there a prolonged period of inactivity in a non-residential/non-hotel area?

Current Location: {{{currentLocation.latitude}}}, {{{currentLocation.longitude}}}
Time: {{{time}}}
Region: {{{region}}}
Planned Itinerary: {{{itinerary}}}
Recent Location History:
{{#each locationHistory}}
- Lat: {{latitude}}, Lon: {{longitude}} at {{timestamp}}
{{/each}}

Generate the safety score and a concise, clear explanation for it based on your analysis of these factors.`,
});
exports.generateSafetyScoreFlow = genkit_1.ai.defineFlow({
    name: 'generateSafetyScoreFlow',
    inputSchema: SafetyScoreInputSchema,
    outputSchema: SafetyScoreOutputSchema,
}, async (input) => {
    const { output } = await prompt(input);
    return output;
});
