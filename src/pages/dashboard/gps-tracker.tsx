import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPin, 
  Navigation, 
  Users, 
  Clock, 
  Search,
  Filter,
  RefreshCw,
  Eye,
  EyeOff,
  Location,
  Route,
  Target,
  AlertCircle,
  CheckCircle,
  Wifi,
  WifiOff,
  Play,
  Pause,
  Stop,
  Settings,
  Download,
  Upload,
  Plus,
  Trash2,
  Edit,
  MoreHorizontal,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  TrendingUp,
  Activity,
  Globe,
  Compass,
  User,
  Building2
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LocationData {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
  status: 'online' | 'offline' | 'away';
  speed?: number;
  heading?: number;
  altitude?: number;
  user?: {
    first_name: string;
    last_name: string;
    role: string;
    avatar_url?: string;
    phone?: string;
    email?: string;
  };
}

interface EmployeeLocation {
  id: string;
  name: string;
  role: string;
  location: {
    lat: number;
    lng: number;
  };
  status: 'online' | 'offline' | 'away';
  lastSeen: string;
  avatar?: string;
  speed?: number;
  heading?: number;
  accuracy?: number;
  email?: string;
  phone?: string;
}

interface Geofence {
  id: string;
  name: string;
  center: { lat: number; lng: number };
  radius: number;
  type: 'office' | 'client' | 'custom';
  active: boolean;
}

export default function GPSTracker() {
  const { user, userProfile } = useAuth();
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [employeeLocations, setEmployeeLocations] = useState<EmployeeLocation[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isTracking, setIsTracking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showOffline, setShowOffline] = useState(true);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [trackingInterval, setTrackingInterval] = useState<NodeJS.Timeout | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list' | 'analytics'>('map');
  const [realTimeUpdates, setRealTimeUpdates] = useState(true);

  // Mock data for demonstration
  const mockEmployeeLocations: EmployeeLocation[] = [
    {
      id: '1',
      name: 'John Doe',
      role: 'Software Engineer',
      location: { lat: 5.5600, lng: -0.2057 }, // Accra coordinates
      status: 'online',
      lastSeen: new Date().toISOString(),
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      speed: 0,
      heading: 0,
      accuracy: 5,
      email: 'john.doe@company.com',
      phone: '+233 20 123 4567'
    },
    {
      id: '2',
      name: 'Jane Smith',
      role: 'HR Manager',
      location: { lat: 5.5600, lng: -0.2057 },
      status: 'away',
      lastSeen: new Date(Date.now() - 300000).toISOString(),
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      speed: 0,
      heading: 0,
      accuracy: 10,
      email: 'jane.smith@company.com',
      phone: '+233 20 123 4568'
    },
    {
      id: '3',
      name: 'Mike Johnson',
      role: 'Sales Executive',
      location: { lat: 5.5600, lng: -0.2057 },
      status: 'offline',
      lastSeen: new Date(Date.now() - 3600000).toISOString(),
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      speed: 0,
      heading: 0,
      accuracy: 0,
      email: 'mike.johnson@company.com',
      phone: '+233 20 123 4569'
    }
  ];

  const mockGeofences: Geofence[] = [
    {
      id: '1',
      name: 'Main Office',
      center: { lat: 5.5600, lng: -0.2057 },
      radius: 100,
      type: 'office',
      active: true
    },
    {
      id: '2',
      name: 'Client Site A',
      center: { lat: 5.5700, lng: -0.2157 },
      radius: 50,
      type: 'client',
      active: true
    }
  ];

  useEffect(() => {
    if (user) {
      fetchLocations();
      fetchEmployeeLocations();
      setGeofences(mockGeofences);
      setEmployeeLocations(mockEmployeeLocations);
      getCurrentLocation();
      
      // Start real-time updates
      if (realTimeUpdates) {
        const interval = setInterval(() => {
          fetchEmployeeLocations();
          fetchLocations();
        }, 30000); // Update every 30 seconds

        return () => clearInterval(interval);
      }
    }
  }, [user, realTimeUpdates]);

  useEffect(() => {
    if (isTracking) {
      startTracking();
    } else {
      stopTracking();
    }

    return () => {
      stopTracking();
    };
  }, [isTracking]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.error('Error getting current location:', error);
          toast.error('Unable to get current location');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    } else {
      toast.error('Geolocation is not supported by this browser');
    }
  };

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('location_data')
        .select(`
          *,
          user:profiles(first_name, last_name, role, avatar_url, phone, email)
        `)
        .order('timestamp', { ascending: false });

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
      toast.error('Failed to load location data');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      
      // Transform data to match EmployeeLocation interface
      const transformedData: EmployeeLocation[] = (data || []).map((employee: any) => ({
        id: employee.id,
        name: `${employee.first_name} ${employee.last_name}`,
        role: employee.role,
        location: { lat: 5.5600, lng: -0.2057 }, // Mock coordinates - in real app, get from location_data table
        status: 'online',
        lastSeen: new Date().toISOString(),
        avatar: employee.avatar_url,
        speed: 0,
        heading: 0,
        accuracy: 5,
        email: employee.email,
        phone: employee.phone
      }));

      setEmployeeLocations(transformedData);
    } catch (error) {
      console.error('Error fetching employee locations:', error);
      setEmployeeLocations(mockEmployeeLocations);
    }
  };

  const startTracking = () => {
    if (navigator.geolocation) {
      const interval = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude, accuracy, speed, heading } = position.coords;
            
            // Update current location
            setCurrentLocation({ lat: latitude, lng: longitude });
            
            // Send location to server
            sendLocationToServer({
              latitude,
              longitude,
              accuracy: accuracy || 0,
              speed: speed || 0,
              heading: heading || 0
            });
          },
          (error) => {
            console.error('Error getting location:', error);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      }, 30000); // Update every 30 seconds

      setTrackingInterval(interval);
      toast.success('Location tracking started');
    } else {
      toast.error('Geolocation is not supported');
    }
  };

  const stopTracking = () => {
    if (trackingInterval) {
      clearInterval(trackingInterval);
      setTrackingInterval(null);
      setIsTracking(false);
      toast.success('Location tracking stopped');
    }
  };

  const sendLocationToServer = async (locationData: {
    latitude: number;
    longitude: number;
    accuracy: number;
    speed: number;
    heading: number;
  }) => {
    try {
      const { error } = await supabase
        .from('location_data')
        .insert({
          user_id: user?.id,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          accuracy: locationData.accuracy,
          speed: locationData.speed,
          heading: locationData.heading,
          timestamp: new Date().toISOString(),
          status: 'online'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending location to server:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-100 text-green-800';
      case 'away': return 'bg-yellow-100 text-yellow-800';
      case 'offline': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'away': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'offline': return <WifiOff className="h-4 w-4 text-gray-500" />;
      default: return <WifiOff className="h-4 w-4 text-gray-500" />;
    }
  };

  const filteredEmployees = employeeLocations.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || employee.status === statusFilter;
    const matchesVisibility = showOffline || employee.status !== 'offline';
    
    return matchesSearch && matchesStatus && matchesVisibility;
  });

  const onlineCount = employeeLocations.filter(emp => emp.status === 'online').length;
  const awayCount = employeeLocations.filter(emp => emp.status === 'away').length;
  const offlineCount = employeeLocations.filter(emp => emp.status === 'offline').length;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Employee GPS Tracking System
        </h1>
        <p className="text-muted-foreground">
          Real-time employee location tracking and monitoring for administrators.
        </p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
                <p className="text-2xl font-bold text-foreground">{employeeLocations.length}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Online</p>
                <p className="text-2xl font-bold text-green-600">{onlineCount}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Away</p>
                <p className="text-2xl font-bold text-yellow-600">{awayCount}</p>
              </div>
              <div className="p-3 rounded-full bg-yellow-100">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Offline</p>
                <p className="text-2xl font-bold text-gray-600">{offlineCount}</p>
              </div>
              <div className="p-3 rounded-full bg-gray-100">
                <WifiOff className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Navigation className="h-5 w-5" />
                  <span className="font-semibold">Tracking Controls</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={isTracking ? 'destructive' : 'default'}
                    size="sm"
                    onClick={() => setIsTracking(!isTracking)}
                  >
                    {isTracking ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Stop Tracking
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Start Tracking
                      </>
                    )}
                  </Button>
                  <Button variant="outline" size="sm" onClick={getCurrentLocation}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowOffline(!showOffline)}>
                  {showOffline ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showOffline ? 'Hide Offline' : 'Show Offline'}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setRealTimeUpdates(!realTimeUpdates)}
                >
                  <Activity className={`h-4 w-4 ${realTimeUpdates ? 'text-green-500' : 'text-gray-500'}`} />
                  {realTimeUpdates ? 'Live' : 'Manual'}
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="map">Map View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Live Map
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Search employees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                    />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="away">Away</SelectItem>
                        <SelectItem value="offline">Offline</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96 bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Interactive map view coming soon</p>
                    <p className="text-sm text-muted-foreground">
                      {currentLocation ? (
                        `Current location: ${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`
                      ) : (
                        'Getting current location...'
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="list" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Employee Locations
                </CardTitle>
                <CardDescription>Real-time location data for all employees</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {filteredEmployees.map((employee) => (
                      <motion.div
                        key={employee.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <Avatar>
                          <AvatarImage src={employee.avatar} />
                          <AvatarFallback>
                            {employee.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{employee.name}</h4>
                            {getStatusIcon(employee.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">{employee.role}</p>
                          <p className="text-xs text-muted-foreground">
                            Last seen: {new Date(employee.lastSeen).toLocaleString()}
                          </p>
                          <div className="flex items-center gap-4 mt-1">
                            {employee.email && (
                              <span className="text-xs text-muted-foreground">
                                <Mail className="h-3 w-3 inline mr-1" />
                                {employee.email}
                              </span>
                            )}
                            {employee.phone && (
                              <span className="text-xs text-muted-foreground">
                                <Phone className="h-3 w-3 inline mr-1" />
                                {employee.phone}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(employee.status)}>
                            {employee.status}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="ghost">
                              <Phone className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Location Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Average Speed</span>
                      <span className="text-sm font-medium">0 km/h</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Distance</span>
                      <span className="text-sm font-medium">0 km</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Active Time</span>
                      <span className="text-sm font-medium">8h 30m</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Geofence Alerts</span>
                      <span className="text-sm font-medium">3</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Activity Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Today's Activity</span>
                      <span className="text-sm font-medium text-green-500">+12%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Weekly Average</span>
                      <span className="text-sm font-medium">85%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Monthly Trend</span>
                      <span className="text-sm font-medium text-blue-500">+5.2%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Response Time</span>
                      <span className="text-sm font-medium">2.3s</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
} 