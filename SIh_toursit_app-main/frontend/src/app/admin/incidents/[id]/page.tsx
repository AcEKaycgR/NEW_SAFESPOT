import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileDown, Send, CheckCircle, FileText, Upload } from "lucide-react";
import Map from "@/components/safespot/map";
import { Timeline, TimelineItem, TimelineConnector, TimelineHeader, TimelineTitle, TimelineIcon, TimelineDescription, TimelineContent } from "@/components/safespot/timeline";

export default function IncidentDetailsPage({ params }: { params: { id: string } }) {
  const incidentId = params.id.toUpperCase();

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Incident {incidentId}</CardTitle>
                <CardDescription>Status: <Badge variant="destructive">Open</Badge> | Risk: <Badge variant="destructive">High</Badge></CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">Acknowledge</Button>
                <Button>Close Incident</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div><strong>Tourist ID:</strong> T-12345678</div>
                <div><strong>Reported at:</strong> 2024-08-16 10:30 AM</div>
                <div><strong>Location:</strong> Marine Drive, Mumbai</div>
                <div><strong>Type:</strong> Theft</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Incident Timeline</CardTitle>
                <CardDescription>Live log of events related to {incidentId}.</CardDescription>
            </CardHeader>
            <CardContent>
                <Timeline>
                    <TimelineItem>
                        <TimelineConnector />
                        <TimelineHeader>
                            <TimelineIcon><CheckCircle className="h-4 w-4" /></TimelineIcon>
                            <TimelineTitle>Dispatch Confirmed</TimelineTitle>
                            <span className="text-xs text-muted-foreground ml-auto">10:32 AM</span>
                        </TimelineHeader>
                        <TimelineContent>
                            <p>Patrol unit P-12 assigned. ETA: 8 minutes.</p>
                        </TimelineContent>
                    </TimelineItem>
                     <TimelineItem>
                        <TimelineConnector />
                        <TimelineHeader>
                            <TimelineIcon><Send className="h-4 w-4" /></TimelineIcon>
                            <TimelineTitle>SOS Signal Received</TimelineTitle>
                             <span className="text-xs text-muted-foreground ml-auto">10:30 AM</span>
                        </TimelineHeader>
                         <TimelineContent>
                            <p>Panic button activated by tourist T-12345678.</p>
                        </TimelineContent>
                    </TimelineItem>
                </Timeline>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Evidence Locker</CardTitle>
                <CardDescription>Attached files and reports for this incident.</CardDescription>
            </CardHeader>
             <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">InitialReport.txt</span>
                    </div>
                    <Button variant="ghost" size="icon"><FileDown className="h-4 w-4" /></Button>
                </div>
             </CardContent>
            <CardFooter className="border-t pt-4">
                 <Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Upload File</Button>
            </CardFooter>
        </Card>

      </div>
      <div className="md:col-span-1 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Last Known Location</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="h-64">
                <Map />
             </div>
             <p className="text-xs text-muted-foreground mt-2">19.0760° N, 72.8777° E (2 mins ago)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Generate EFIR</CardTitle>
            <CardDescription>Auto-generate an Electronic First Information Report.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              <FileDown className="mr-2 h-4 w-4" />
              Generate & Download PDF
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
