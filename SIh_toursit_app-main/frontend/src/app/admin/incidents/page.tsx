"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FilePlus,
  Filter,
  Search,
  Sparkles,
  MoreVertical,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { detectAnomaliesInIncidents } from "@/app/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { DetectAnomaliesInIncidentsOutput } from "@/ai/flows/anomaly-detection-for-incidents";

const allIncidents = [
    { id: "INC-001", type: "Theft", location: "Marine Drive", time: "2024-08-15 14:30", status: "Open", risk: "High" },
    { id: "INC-002", type: "Medical", location: "Gateway of India", time: "2024-08-15 14:25", status: "Acknowledged", risk: "Medium" },
    { id: "INC-003", type: "Disturbance", location: "Juhu Beach", time: "2024-08-15 13:50", status: "Closed", risk: "Low" },
    { id: "INC-004", type: "Lost Item", location: "Colaba Market", time: "2024-08-15 13:45", status: "Open", risk: "Low" },
    { id: "INC-005", type: "Suspicious Activity", location: "Bandra Fort", time: "2024-08-15 12:10", status: "Acknowledged", risk: "High" },
    { id: "INC-006", type: "Harassment", location: "Haji Ali Dargah", time: "2024-08-15 11:55", status: "Closed", risk: "Medium" },
    { id: "INC-007", type: "Accident", location: "Worli Sea Face", time: "2024-08-15 10:30", status: "Open", risk: "High" },
];

export default function IncidentsPage() {
    const { toast } = useToast();
    const [incidentReport, setIncidentReport] = useState("");
    const [analysisResult, setAnalysisResult] = useState<DetectAnomaliesInIncidentsOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleAnalyze = async () => {
        if (!incidentReport.trim()) {
            toast({ title: "Error", description: "Incident report cannot be empty.", variant: "destructive" });
            return;
        }
        setIsLoading(true);
        setAnalysisResult(null);
        try {
            // In a real app, you'd fetch location history and itinerary for the relevant tourist
            const result = await detectAnomaliesInIncidents({ incidentReport });
            setAnalysisResult(result);
        } catch (error) {
            toast({ title: "Analysis Failed", description: "Could not analyze the report.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };


  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Anomaly Detection</CardTitle>
          <CardDescription>
            Use AI to detect anomalies in new incident reports before logging
            them.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="incident-report">New Incident Report Text</Label>
            <Textarea
              id="incident-report"
              placeholder="Paste or type incident report details here... The model can also analyze location history and itinerary deviations if provided."
              className="min-h-[100px]"
              value={incidentReport}
              onChange={(e) => setIncidentReport(e.target.value)}
            />
          </div>
          <Button onClick={handleAnalyze} disabled={isLoading}>
            <Sparkles className="mr-2 h-4 w-4" />
            {isLoading ? 'Analyzing...' : 'Analyze for Anomalies'}
          </Button>
          {analysisResult && (
             <Alert variant={analysisResult.isAnomalous ? "destructive" : "default"}>
                <Sparkles className="h-4 w-4" />
                <AlertTitle>{analysisResult.isAnomalous ? `Anomaly Detected! (Confidence: ${Math.round(analysisResult.confidenceScore * 100)}%)` : "No Anomaly Detected"}</AlertTitle>
                <AlertDescription>
                    {analysisResult.anomalyExplanation}
                </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Incident Management</CardTitle>
              <CardDescription>
                View, filter, and manage all reported incidents.
              </CardDescription>
            </div>
            <Dialog>
                <DialogTrigger asChild>
                    <Button><FilePlus className="mr-2 h-4 w-4" /> New Incident</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Incident</DialogTitle>
                        <DialogDescription>Manually log a new incident report.</DialogDescription>
                    </DialogHeader>
                    {/* A form to create a new incident would go here */}
                    <p className="text-center text-muted-foreground py-8">New incident form placeholder.</p>
                </DialogContent>
            </Dialog>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search incidents..." className="pl-8" />
            </div>
            <div className="flex gap-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="acknowledged">Acknowledged</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Risk" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risks</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allIncidents.map((incident) => (
                <TableRow key={incident.id}>
                  <TableCell className="font-medium">{incident.id}</TableCell>
                  <TableCell>{incident.type}</TableCell>
                  <TableCell>{incident.location}</TableCell>
                  <TableCell>{incident.time}</TableCell>
                  <TableCell>
                    <Badge variant={incident.status === 'Open' ? 'destructive' : (incident.status === 'Acknowledged' ? 'secondary' : 'default')}>{incident.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={incident.risk === 'High' ? 'destructive' : (incident.risk === 'Medium' ? 'secondary' : 'outline')}>{incident.risk}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
