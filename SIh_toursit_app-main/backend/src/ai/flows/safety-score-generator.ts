'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a live safety score for a tourist's current location.
 *
 * - generateSafetyScore - A function that generates the safety score.
 * - SafetyScoreInput - The input type for the generateSafetyScore function.
 * - SafetyScoreOutput - The return type for the generateSafetyScore function.
 */

import {ai} from '../genkit';
import {z} from 'genkit';

const LocationPointSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  timestamp: z.string().describe("ISO 8601 timestamp"),
});

const SafetyScoreInputSchema = z.object({
  currentLocation: LocationPointSchema,
  locationHistory: z.array(LocationPointSchema).describe("Recent location history of the tourist."),
  itinerary: z.string().optional().describe("The tourist's planned itinerary for the day or trip. E.g., 'Morning: Gateway of India, Afternoon: Marine Drive'"),
  time: z.string().describe('The current time.'),
  region: z.string().describe('The region of the location.'),
});
export type SafetyScoreInput = z.infer<typeof SafetyScoreInputSchema>;

const SafetyScoreOutputSchema = z.object({
  safetyScore: z
    .number()
    .describe(
      'A safety score between 0 and 100, where 0 is the least safe and 100 is the safest.'
    ),
  explanation: z
    .string()
    .describe('An explanation of the safety score based on available data, including factors like time of day, location risk, and deviation from itinerary.'),
});
export type SafetyScoreOutput = z.infer<typeof SafetyScoreOutputSchema>;

export async function generateSafetyScore(
  input: SafetyScoreInput
): Promise<SafetyScoreOutput> {
  return generateSafetyScoreFlow(input);
}

const prompt = ai.definePrompt({
  name: 'safetyScorePrompt',
  input: {schema: SafetyScoreInputSchema},
  output: {schema: SafetyScoreOutputSchema},
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

export const generateSafetyScoreFlow = ai.defineFlow(
  {
    name: 'generateSafetyScoreFlow',
    inputSchema: SafetyScoreInputSchema,
    outputSchema: SafetyScoreOutputSchema,
  },
  async (input: SafetyScoreInput) => {
    const {output} = await prompt(input);
    return output!;
  }
);
