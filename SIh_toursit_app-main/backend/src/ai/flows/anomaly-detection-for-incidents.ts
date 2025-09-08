'use server';
/**
 * @fileOverview Anomaly detection for incident reports.
 *
 * - detectAnomaliesInIncidents - A function that handles the anomaly detection process.
 * - DetectAnomaliesInIncidentsInput - The input type for the detectAnomaliesInIncidents function.
 * - DetectAnomaliesInIncidentsOutput - The return type for the detectAnomaliesInIncidents function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectAnomaliesInIncidentsInputSchema = z.object({
  incidentReport: z.string().describe('The incident report text, which could be from a tourist or an observer.'),
  locationHistory: z.array(z.object({
    latitude: z.number(),
    longitude: z.number(),
    timestamp: z.string().describe("ISO 8601 timestamp"),
  })).optional().describe("The tourist's recent location history, if available."),
  itinerary: z.string().optional().describe("The tourist's planned itinerary."),
});
export type DetectAnomaliesInIncidentsInput = z.infer<typeof DetectAnomaliesInIncidentsInputSchema>;

const DetectAnomaliesInIncidentsOutputSchema = z.object({
  isAnomalous: z.boolean().describe('Whether the incident report is anomalous.'),
  anomalyExplanation: z
    .string()
    .describe('Explanation of why the incident report is considered anomalous, considering the report text, location patterns, and itinerary deviations.'),
  confidenceScore: z.number().describe("A confidence score (0-1) indicating the likelihood that this is a true anomaly."),
});
export type DetectAnomaliesInIncidentsOutput = z.infer<typeof DetectAnomaliesInIncidentsOutputSchema>;

export async function detectAnomaliesInIncidents(
  input: DetectAnomaliesInIncidentsInput
): Promise<DetectAnomaliesInIncidentsOutput> {
  return detectAnomaliesInIncidentsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectAnomaliesInIncidentsPrompt',
  input: {schema: DetectAnomaliesInIncidentsInputSchema},
  output: {schema: DetectAnomaliesInIncidentsOutputSchema},
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

export const detectAnomaliesInIncidentsFlow = ai.defineFlow(
  {
    name: 'detectAnomaliesInIncidentsFlow',
    inputSchema: DetectAnomaliesInIncidentsInputSchema,
    outputSchema: DetectAnomaliesInIncidentsOutputSchema,
  },
  async (input: DetectAnomaliesInIncidentsInput) => {
    const {output} = await prompt(input);
    return output!;
  }
);
