import {z} from 'genkit';

export const ItineraryItemSchema = z.object({
    title: z.string().describe("The title of the itinerary event."),
    date: z.string().describe("The date of the event in 'YYYY-MM-DD' format."),
    details: z.string().optional().describe("Additional details like flight numbers, booking references, or addresses."),
    type: z.enum(['flight', 'hotel', 'activity', 'other']).describe("The type of itinerary item."),
});

export type ItineraryItem = z.infer<typeof ItineraryItemSchema>;
