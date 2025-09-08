import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Globe, Trash2, PlusCircle, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  return (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
      </TabsList>
      <TabsContent value="general">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>
              Manage general application settings and preferences.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="app-name">Application Name</Label>
              <Input id="app-name" defaultValue="SafeSpot" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="default-tz">Default Timezone</Label>
              <Select defaultValue="asia-kolkata">
                <SelectTrigger id="default-tz">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asia-kolkata">(GMT+5:30) India Standard Time</SelectItem>
                  <SelectItem value="utc-0">(GMT+0:00) Coordinated Universal Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">
                    Temporarily disable access for non-admin users.
                </p>
              </div>
              <Switch id="maintenance-mode" />
            </div>
             <Button><Save className="mr-2 h-4 w-4" /> Save Changes</Button>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="webhooks">
        <Card>
          <CardHeader>
            <CardTitle>Outbound Webhooks</CardTitle>
            <CardDescription>
              Configure webhooks to send event data to external services.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4 rounded-lg border p-4">
                <h3 className="font-medium">New Webhook Endpoint</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="webhook-url">Endpoint URL</Label>
                        <Input id="webhook-url" placeholder="https://api.example.com/webhook" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="webhook-event">Event Type</Label>
                        <Select defaultValue="incident.created">
                            <SelectTrigger id="webhook-event">
                                <SelectValue placeholder="Select event" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="incident.created">Incident Created</SelectItem>
                                <SelectItem value="incident.status.changed">Incident Status Changed</SelectItem>
                                <SelectItem value="geofence.breach">Geofence Breach</SelectItem>
                                <SelectItem value="*">All Events</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                 <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Webhook</Button>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Configured Webhooks</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>URL</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-mono text-sm">https://hooks.make.com/...</TableCell>
                    <TableCell><Badge variant="secondary">incident.created</Badge></TableCell>
                    <TableCell><Badge className="bg-green-500/20 text-green-700">Active</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                   <TableRow>
                    <TableCell className="font-mono text-sm">https://api.internal/notify</TableCell>
                    <TableCell><Badge variant="secondary">*</Badge></TableCell>
                    <TableCell><Badge className="bg-yellow-500/20 text-yellow-700">Failing</Badge></TableCell>
                     <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="notifications">
        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>
              Manage how and when authorities are notified.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                    <Label>High-Priority Incident Email</Label>
                    <p className="text-sm text-muted-foreground">Send an email to all supervisors for high-risk incidents.</p>
                </div>
                <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                    <Label>Geofence Breach SMS</Label>
                    <p className="text-sm text-muted-foreground">Send SMS to nearest patrol unit on geofence breach.</p>
                </div>
                <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                    <Label>Daily Summary Report</Label>
                    <p className="text-sm text-muted-foreground">Email a daily summary of all incidents to admins.</p>
                </div>
                <Switch />
            </div>
             <Button><Save className="mr-2 h-4 w-4" /> Save Changes</Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
