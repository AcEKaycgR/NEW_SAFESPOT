import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, MapPin, Clock, User, Shield, AlertCircle } from 'lucide-react';
import { authenticatedFetch } from '@/lib/auth';

interface Location {
  latitude: number;
  longitude: number;
}

interface AccessRecord {
  id: string;
  accessorId: string;
  accessorName: string;
  accessTime: string;
  purpose: string;
  location: Location | null;
  approved: boolean;
}

interface AccessHistoryProps {
  refresh?: boolean;
}

export const AccessHistory: React.FC<AccessHistoryProps> = ({ refresh = false }) => {
  const [accessHistory, setAccessHistory] = useState<AccessRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAccessHistory = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authenticatedFetch('/api/location/access-history');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Handle both array format and object format from backend
        let historyData = result.data || [];
        
        // If data is an object with accessLogs and sharingHistory, combine them
        if (historyData && typeof historyData === 'object' && !Array.isArray(historyData)) {
          const { accessLogs = [], sharingHistory = [] } = historyData;
          
          // Convert to access record format
          historyData = [
            ...accessLogs.map((log: any) => ({
              id: log.id || `log-${log.accessor_id}-${log.accessed_at}`,
              accessorId: log.accessor_id,
              accessorName: `User ${log.accessor_id}`,
              timestamp: log.accessed_at,
              location: log.location_accessed,
              purpose: log.access_reason || 'Location access',
              duration: 0,
              approved: true
            })),
            ...sharingHistory.map((share: any) => ({
              id: share.id || `share-${share.id}`,
              accessorId: 'shared',
              accessorName: 'Location Sharing',
              timestamp: share.created_at,
              location: { latitude: 0, longitude: 0 },
              purpose: `Shared with precision: ${share.precision}`,
              duration: share.expires_at ? new Date(share.expires_at).getTime() - new Date(share.created_at).getTime() : 0,
              approved: true
            }))
          ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        }
        
        setAccessHistory(Array.isArray(historyData) ? historyData : []);
      } else {
        throw new Error(result.message || 'Failed to load access history');
      }
    } catch (error) {
      console.error('Failed to load access history:', error);
      setError('Failed to load access history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAccessHistory();
  }, [refresh]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatLocation = (location: Location) => {
    return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
  };

  const getAccessorIcon = (approved: boolean) => {
    if (approved) {
      return <Shield className="h-4 w-4 text-green-600" />;
    }
    return <AlertCircle className="h-4 w-4 text-red-600" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Recent Access History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2 text-gray-500">
              <Clock className="h-4 w-4 animate-spin" />
              Loading access history...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Recent Access History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2 text-red-500">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Recent Access History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {accessHistory.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center text-gray-500">
              <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No location access history found</p>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-64">
            <div className="space-y-3">
              {accessHistory.map((record) => (
                <div
                  key={record.id}
                  data-testid="access-entry"
                  className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-shrink-0">
                    {getAccessorIcon(record.approved)}
                  </div>
                  
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-gray-400" />
                        <span className="font-medium text-sm">{record.accessorName}</span>
                      </div>
                      <Badge variant={record.approved ? 'default' : 'destructive'}>
                        {record.approved ? 'Approved' : 'Denied'}
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-gray-600 mb-2">{record.purpose}</p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(record.accessTime)}
                      </div>
                      
                      {record.approved && record.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {formatLocation(record.location)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
