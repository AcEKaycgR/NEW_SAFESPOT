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
import { FilePlus, MoreVertical, Trash2, Edit } from "lucide-react";
import Map from "@/components/safespot/map";
import GeofenceDashboard from "@/components/geofencing/geofence-dashboard";

const geofences = [
    { id: "GZ-01", name: "South Mumbai Tourist Hub", risk: "High", type: "Polygon", created: "2024-08-01" },
    { id: "GZ-02", name: "Juhu Beach Area", risk: "Medium", type: "Polygon", created: "2024-07-25" },
    { id: "GZ-03", name: "Film City Perimeter", risk: "Low", type: "Circle", created: "2024-07-20" },
    { id: "GZ-04", name: "Dharavi Market Zone", risk: "High", type: "Polygon", created: "2024-08-10" },
    { id: "GZ-05", name: "Airport Arrival/Departure", risk: "Medium", type: "Polygon", created: "2024-07-15" },
];

export default function GeofencesPage() {
  return (
    <GeofenceDashboard />
  );
}
