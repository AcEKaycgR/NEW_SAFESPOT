import { KpiCard } from "@/components/safespot/kpi-card";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ShieldAlert, Users, Siren, Map, BarChart, MapPin, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const incidents = [
  { id: "INC-001", type: "Theft", location: "Marine Drive", status: "Open", risk: "High" },
  { id: "INC-002", type: "Medical", location: "Gateway of India", status: "Acknowledged", risk: "Medium" },
  { id: "INC-003", type: "Disturbance", location: "Juhu Beach", status: "Closed", risk: "Low" },
  { id: "INC-004", type: "Lost Item", location: "Colaba Market", status: "Open", risk: "Low" },
  { id: "INC-005", type: "Suspicious Activity", location: "Bandra Fort", status: "Acknowledged", risk: "High" },
];

const personnel = [
    { name: "Officer Sharma", role: "Patrol", status: "Active", avatar: "AS" },
    { name: "Sgt. Khan", role: "Dispatch", status: "Active", avatar: "SK" },
    { name: "Const. Patil", role: "On-site", status: "Active", avatar: "CP" },
    { name: "Inspector Reddy", role: "Supervisor", status: "Idle", avatar: "IR" },
]

export default function AdminDashboardPage() {
  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          title="Open Incidents"
          value="12"
          description="+5 from last hour"
          Icon={Siren}
        />
        <KpiCard
          title="Active Personnel"
          value="48"
          description="3 units on-site"
          Icon={Users}
        />
        <KpiCard
          title="High-Risk Zones"
          value="7"
          description="2 new zones added today"
          Icon={Map}
        />
        <KpiCard
          title="Avg. Response Time"
          value="6.2 min"
          description="-1.1 min from yesterday"
          Icon={BarChart}
        />
        <KpiCard
          title="Jurisdiction"
          value="South Mumbai"
          description="Zone A-1"
          Icon={MapPin}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Incidents</CardTitle>
            <CardDescription>
              A live feed of reported incidents across the region.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Incident ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incidents.map((incident) => (
                  <TableRow key={incident.id}>
                    <TableCell className="font-medium">{incident.id}</TableCell>
                    <TableCell>{incident.type}</TableCell>
                    <TableCell>{incident.location}</TableCell>
                    <TableCell>
                      <Badge variant={incident.status === 'Open' ? 'destructive' : (incident.status === 'Acknowledged' ? 'secondary' : 'default')}>{incident.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={incident.risk === 'High' ? 'destructive' : (incident.risk === 'Medium' ? 'secondary' : 'outline')}>{incident.risk}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/incidents/${incident.id}`}>
                          View <ExternalLink className="ml-2 h-3 w-3" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Personnel</CardTitle>
            <CardDescription>On-duty officers and dispatchers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {personnel.map((p) => (
                 <div key={p.name} className="flex items-center gap-4">
                    <Avatar>
                        <AvatarImage src={`https://i.pravatar.cc/40?u=${p.avatar}`} />
                        <AvatarFallback>{p.avatar}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <p className="font-medium">{p.name}</p>
                        <p className="text-sm text-muted-foreground">{p.role}</p>
                    </div>
                     <Badge variant={p.status === 'Active' ? 'default' : 'outline'} className={p.status === 'Active' ? 'bg-green-500/20 text-green-700 border-green-500/30' : ''}>{p.status}</Badge>
                 </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
