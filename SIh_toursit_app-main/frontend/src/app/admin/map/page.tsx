
import Map from "@/components/safespot/map";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ListFilter } from "lucide-react";

export default function AdminMapPage() {
    return (
        <div className="h-full w-full relative">
            <Map className="absolute inset-0" showControls={true} showGeofences={true} showCurrentLocation={true} />
            <Card className="absolute top-4 left-4 w-80 shadow-lg">
                <CardHeader>
                    <CardTitle>Map Dashboard</CardTitle>
                    <CardDescription>Live view of tourists and risk zones.</CardDescription>
                </CardHeader>
                <CardContent>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full">
                                <ListFilter className="mr-2 h-4 w-4" />
                                Filter Layers
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56">
                            <DropdownMenuLabel>Map Overlays</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Tourist Clusters</DropdownMenuItem>
                            <DropdownMenuItem>Risk Heatmap</DropdownMenuItem>
                            <DropdownMenuItem>Geofence Zones</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    {/* Time scrubber would go here */}
                </CardContent>
            </Card>
        </div>
    );
}
