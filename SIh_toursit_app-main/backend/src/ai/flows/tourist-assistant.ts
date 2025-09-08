'use server';
/**
 * @fileOverview A multi-purpose AI assistant for tourists.
 *
 * - touristAssistant - A function that understands user intent and provides appropriate responses.
 * - TouristAssistantInput - The input type for the touristAssistant function.
 * - TouristAssistantOutput - The return type for the touristAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { ItineraryItemSchema } from '@/ai/schemas/itinerary-item';


const TouristAssistantInputSchema = z.object({
  message: z.string().describe('The user\'s message to the assistant.'),
  currentLocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional().describe("The user's current location, if available."),
});
export type TouristAssistantInput = z.infer<typeof TouristAssistantInputSchema>;

const TouristAssistantOutputSchema = z.object({
    intent: z.enum(['itinerary', 'safety', 'emergency', 'general'])
        .describe("The detected intent of the user's message."),
    responseText: z.string().describe("The AI's textual response to the user."),
    itineraryItems: z.array(ItineraryItemSchema).optional().describe("A list of structured itinerary items parsed from the user's message. Only populated if intent is 'itinerary'."),
    isEmergency: z.boolean().describe("True if the user's message indicates a potential emergency."),
});
export type TouristAssistantOutput = z.infer<typeof TouristAssistantOutputSchema>;

export async function touristAssistant(
  input: TouristAssistantInput
): Promise<TouristAssistantOutput> {
  return touristAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'touristAssistantPrompt',
  input: {schema: TouristAssistantInputSchema},
  output: {schema: TouristAssistantOutputSchema},
  prompt: `You are a friendly and highly capable AI assistant for a tourist safety app called SafeSpot. Your goal is to help tourists with their travel plans and safety concerns.

You must first determine the user's intent from their message and then respond accordingly. The possible intents are: 'itinerary', 'safety', 'emergency', or 'general'.

Current Date: ${new Date().toDateString()}
{{#if currentLocation}}
Current Location: Lat {{currentLocation.latitude}}, Lon {{currentLocation.longitude}}
{{/if}}

1.  **Itinerary Intent**:
    - If the user is describing their travel plans, set the intent to 'itinerary'.
    - Parse their message to extract structured itinerary items (flights, hotels, activities).
    - For dates, if the user says "tomorrow" or "next Friday", calculate the actual date based on the current date provided above.
    - Create a friendly 'responseText' confirming that you've understood and asking them to review the items you've created.
    - Example: User says "I'm flying to Mumbai tomorrow, arriving at 8 AM. My flight is AI-101. I'll be staying at the Taj Palace." You should create two itinerary items (one for the flight, one for the hotel) and respond with something like "Great, I've added your flight and hotel to your plan. Please review and confirm."

2.  **Safety Intent**:
    - If the user is asking a question about safety, set the intent to 'safety'.
    - Provide a helpful, clear, and cautious response.
    - Use your knowledge of general travel safety and the provided location context if available.
    - DO NOT provide legal or medical advice.
    - Example: User asks "Is it safe to walk in Colaba at night?" You should provide a balanced answer, like "Colaba is generally busy, but it's always wise to stick to well-lit main roads and be aware of your surroundings, as you would in any major city."

3.  **Emergency Intent**:
    - If the user's message indicates they are in immediate danger or distress (e.g., "help me," "I'm being followed," "I'm lost and scared"), set the intent to 'emergency' and set 'isEmergency' to true.
    - The 'responseText' should be calm, reassuring, and provide clear, actionable instructions.
    - Example: User says "I think I'm being followed." You should respond with "Stay calm. Head to a busy, well-lit public area immediately, like a shop or restaurant. Do not go to an isolated place. I am notifying the authorities of your location. Can you see any landmarks?"

4.  **General Intent**:
    - For any other conversation (greetings, questions about the app, etc.), set the intent to 'general'.
    - Provide a friendly, conversational response.

User Message:
"{{{message}}}"
`,
});

export const touristAssistantFlow = ai.defineFlow(
  {
    name: 'touristAssistantFlow',
    inputSchema: TouristAssistantInputSchema,
    outputSchema: TouristAssistantOutputSchema,
  },
  async (input: TouristAssistantInput) => {
    const {output} = await prompt(input);
    return output!;
  }
);
