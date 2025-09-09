"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItineraryItemSchema = void 0;
const genkit_1 = require("genkit");
exports.ItineraryItemSchema = genkit_1.z.object({
    title: genkit_1.z.string().describe("The title of the itinerary event."),
    date: genkit_1.z.string().describe("The date of the event in 'YYYY-MM-DD' format."),
    details: genkit_1.z.string().optional().describe("Additional details like flight numbers, booking references, or addresses."),
    type: genkit_1.z.enum(['flight', 'hotel', 'activity', 'other']).describe("The type of itinerary item."),
});
