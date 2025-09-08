import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";

export default function DigitalIdCard({ simple = false }: { simple?: boolean }) {
    if (simple) {
        return (
            <Card className="w-full overflow-hidden relative flex items-center gap-4 p-4">
                 <Avatar className="h-16 w-16 border-2 border-background">
                    <AvatarImage src="" data-ai-hint="person portrait" />
                    <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle className="text-xl font-headline">John Doe</CardTitle>
                    <CardDescription>T-12345678</CardDescription>
                </div>
            </Card>
        )
    }


  return (
    <Card className="w-full max-w-md mx-auto overflow-hidden shadow-lg border-2 border-primary/20 bg-gradient-to-br from-card to-muted/30">
        <CardHeader className="p-0 relative h-28">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-80" />
            <div 
                className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
            />

             <div className="absolute top-4 right-4 flex items-center gap-2 text-white/80 text-xs font-semibold backdrop-blur-sm bg-black/20 px-2 py-1 rounded-full">
                <ShieldCheck className="h-4 w-4" />
                <span>Verified Tourist</span>
            </div>
            
            <div className="relative flex items-end gap-4 p-4 h-full">
                 <Avatar className="h-24 w-24 border-4 border-background shadow-lg -mb-12">
                    <AvatarImage src="" data-ai-hint="person portrait" />
                    <AvatarFallback>JD</AvatarFallback>
                </Avatar>
            </div>
        </CardHeader>
      <CardContent className="p-6 pt-16">
        <div className="text-center mb-6">
            <CardTitle className="text-2xl font-headline">John Doe</CardTitle>
            <CardDescription className="font-mono text-primary">T-12345678</CardDescription>
        </div>

        <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">Nationality</p>
                        <p className="font-medium">American</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Date of Birth</p>
                        <p className="font-medium">Jan 01, 1990</p>
                    </div>
                </div>
                 <div>
                    <p className="text-sm text-muted-foreground">Passport No.</p>
                    <p className="font-medium font-mono">L23456789</p>
                </div>
                <Separator />
                <div>
                    <p className="text-sm text-muted-foreground">Visit Validity</p>
                    <p className="font-medium">Aug 10, 2024 - Sep 09, 2024</p>
                </div>
                 <div>
                    <p className="text-sm text-muted-foreground">Emergency Contact</p>
                    <p className="font-medium font-mono">+1-202-555-0199</p>
                </div>
            </div>
            <div className="col-span-1 flex flex-col items-center justify-center space-y-2">
                <div className="p-2 bg-white rounded-md border shadow">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=T-12345678&bgcolor=F0F8FF" alt="QR Code" width={100} height={100} />
                </div>
                <p className="text-xs text-muted-foreground text-center">Scan for verification</p>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
