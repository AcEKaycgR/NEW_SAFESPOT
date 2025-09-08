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
import { Download, Search } from "lucide-react";
import { DatePickerWithRange } from "@/components/safespot/date-picker-with-range";

const auditLogs = [
  { id: 1, user: "admin@safespot.gov", action: "INCIDENT_CLOSE", details: "Closed incident INC-003", timestamp: "2024-08-15 14:00:12" },
  { id: 2, user: "officer.sharma@safespot.gov", action: "GEOFENCE_ENTER", details: "Tourist ID T-1234 entered GZ-01", timestamp: "2024-08-15 13:55:03" },
  { id: 3, user: "sgt.khan@safespot.gov", action: "DISPATCH_ACK", details: "Acknowledged INC-002", timestamp: "2024-08-15 13:52:45" },
  { id: 4, user: "system", action: "ANOMALY_DETECTED", details: "High probability anomaly in report for INC-005", timestamp: "2024-08-15 12:11:30" },
  { id: 5, user: "admin@safespot.gov", action: "GEOFENCE_CREATE", details: "Created geofence GZ-04", timestamp: "2024-08-15 11:30:00" },
  { id: 6, user: "tourist_app", action: "SOS_TRIGGER", details: "Panic button triggered by T-5678 at 19.0760° N, 72.8777° E", timestamp: "2024-08-15 10:29:15" },
];

export default function AuditLogPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Log</CardTitle>
        <CardDescription>
          An append-only trail of all system and user actions.
        </CardDescription>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by user, action, or details..."
              className="pl-8"
            />
          </div>
          <div className="flex gap-2">
            <Select defaultValue="all">
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="incident">Incident Actions</SelectItem>
                <SelectItem value="geofence">Geofence Actions</SelectItem>
                <SelectItem value="user_auth">User Auth</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
            <DatePickerWithRange />
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User/Service</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-mono text-xs">{log.timestamp}</TableCell>
                <TableCell className="font-medium">{log.user}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{log.action}</Badge>
                </TableCell>
                <TableCell className="font-code text-xs">{log.details}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
