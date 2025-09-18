import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Users, 
  Building2, 
  TrendingUp, 
  DollarSign,
  Settings,
  Shield,
  BarChart3,
  UserPlus,
  Search,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  Edit,
  Eye,
  Activity,
  Database,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Globe,
  Lock,
  Unlock,
  Key,
  Monitor,
  Smartphone,
  Tablet,
  Globe2,
  ShieldCheck,
  AlertCircle,
  Info,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Plus,
  Trash2,
  Archive,
  Copy,
  ExternalLink,
  Bell
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  employee_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  phone?: string;
  position?: string;
  hire_date: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
  login_count?: number;
}

interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkUsage: number;
  activeUsers: number;
  totalRequests: number;
  errorRate: number;
  uptime: number;
}

interface SecurityEvent {
  id: string;
  type: 'login' | 'logout' | 'failed_login' | 'permission_change' | 'data_access' | 'system_change';
  user_id: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  ip_address?: string;
  user_agent?: string;
}

export default function AdminDashboard() {
  const { userProfile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    cpuUsage: 45,
    memoryUsage: 62,
    diskUsage: 78,
    networkUsage: 23,
    activeUsers: 156,
    totalRequests: 1247,
    errorRate: 2.3,
    uptime: 99.8
  });
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
    loadSystemMetrics();
    loadSecurityEvents();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadSystemMetrics = async () => {
    // Mock system metrics - in real app, these would come from monitoring APIs
    setSystemMetrics({
      cpuUsage: Math.floor(Math.random() * 100),
      memoryUsage: Math.floor(Math.random() * 100),
      diskUsage: Math.floor(Math.random() * 100),
      networkUsage: Math.floor(Math.random() * 100),
      activeUsers: Math.floor(Math.random() * 200) + 100,
      totalRequests: Math.floor(Math.random() * 2000) + 1000,
      errorRate: Math.random() * 5,
      uptime: 99.8
    });
  };

  const loadSecurityEvents = async () => {
    // Mock security events
    const mockEvents: SecurityEvent[] = [
      {
        id: '1',
        type: 'login',
        user_id: 'user1',
        description: 'Successful login from 192.168.1.100',
        severity: 'low',
        timestamp: new Date().toISOString(),
        ip_address: '192.168.1.100'
      },
      {
        id: '2',
        type: 'failed_login',
        user_id: 'user2',
        description: 'Failed login attempt from 203.0.113.45',
        severity: 'medium',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        ip_address: '203.0.113.45'
      },
      {
        id: '3',
        type: 'permission_change',
        user_id: 'user3',
        description: 'User role changed from employee to hr',
        severity: 'high',
        timestamp: new Date(Date.now() - 7200000).toISOString()
      }
    ];
    setSecurityEvents(mockEvents);
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', userId);

      if (error) throw error;
      
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, is_active: !currentStatus } : user
      ));
      
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const filteredUsers = users.filter(user =>
    user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.employee_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'hr': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const statCards = [
    { 
      title: 'Total Users', 
      value: users.length, 
      icon: Users, 
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      trend: '+8%',
      trendUp: true
    },
    { 
      title: 'Active Users', 
      value: users.filter(u => u.is_active).length, 
      icon: Activity, 
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      trend: '+12%',
      trendUp: true
    },
    { 
      title: 'System Uptime', 
      value: `${systemMetrics.uptime}%`, 
      icon: Server, 
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      trend: '+0.2%',
      trendUp: true
    },
    { 
      title: 'Error Rate', 
      value: `${systemMetrics.errorRate}%`, 
      icon: AlertTriangle, 
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      trend: '-0.5%',
      trendUp: false
    },
  ];

  const quickActions = [
    { title: 'User Management', icon: Users, color: 'bg-blue-500', href: '/dashboard/admin/users' },
    { title: 'System Settings', icon: Settings, color: 'bg-gray-500', href: '/dashboard/admin/settings' },
    { title: 'Security Audit', icon: Shield, color: 'bg-red-500', href: '/dashboard/admin/security' },
    { title: 'Analytics', icon: BarChart3, color: 'bg-green-500', href: '/dashboard/admin/analytics' },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-foreground mb-2">
          System Administration Dashboard
        </h1>
        <p className="text-muted-foreground">
          Complete system oversight, security monitoring, and administrative controls.
        </p>
      </motion.div>

      {/* Add notification and message icons to the top of the dashboard */}
      <div className="flex justify-end gap-4 mb-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon">
              <Mail className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <h4 className="font-bold mb-2">Messages</h4>
            {/* Render dynamic messages here */}
            <div>New message from HR: "Please review the latest policy update."</div>
            <div>System: "Your password will expire in 3 days."</div>
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <h4 className="font-bold mb-2">Notifications</h4>
            {/* Render dynamic notifications here */}
            <div>New user registered: John Doe (Employee)</div>
            <div>System maintenance scheduled for tonight at 11pm.</div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className={`h-3 w-3 ${stat.trendUp ? 'text-green-500' : 'text-red-500'}`} />
                      <span className={`text-xs ${stat.trendUp ? 'text-green-500' : 'text-red-500'}`}>
                        {stat.trend}
                      </span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* System Health */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Health
            </CardTitle>
            <CardDescription>Real-time system performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">CPU Usage</span>
                  <span className="text-sm text-muted-foreground">{systemMetrics.cpuUsage}%</span>
                </div>
                <Progress value={systemMetrics.cpuUsage} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Memory</span>
                  <span className="text-sm text-muted-foreground">{systemMetrics.memoryUsage}%</span>
                </div>
                <Progress value={systemMetrics.memoryUsage} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Disk Space</span>
                  <span className="text-sm text-muted-foreground">{systemMetrics.diskUsage}%</span>
                </div>
                <Progress value={systemMetrics.diskUsage} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Network</span>
                  <span className="text-sm text-muted-foreground">{systemMetrics.networkUsage}%</span>
                </div>
                <Progress value={systemMetrics.networkUsage} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    User Management
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                    />
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add User
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {filteredUsers.map((user) => (
                      <div key={user.id} className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                        <Avatar>
                          <AvatarImage src={user.avatar_url} />
                          <AvatarFallback>
                            {user.first_name?.[0]}{user.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{user.first_name} {user.last_name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <p className="text-xs text-muted-foreground">
                            {user.position || 'No position'} • {user.employee_id}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getRoleColor(user.role)}>
                            {user.role}
                          </Badge>
                          <Badge variant={user.is_active ? 'default' : 'secondary'}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleUserStatus(user.id, user.is_active)}
                          >
                            {user.is_active ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Events
                </CardTitle>
                <CardDescription>Recent security activities and alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {securityEvents.map((event) => (
                    <div key={event.id} className="flex items-center gap-4 p-4 rounded-lg border">
                      <div className={`p-2 rounded-full ${getSeverityColor(event.severity)}`}>
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{event.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(event.timestamp).toLocaleString()}
                          {event.ip_address && ` • IP: ${event.ip_address}`}
                        </p>
                      </div>
                      <Badge className={getSeverityColor(event.severity)}>
                        {event.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    System Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Server Status</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Online
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Database Status</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">SSL Certificate</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Valid
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Backup Status</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Up to date
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Response Time</span>
                      <span className="text-sm font-medium">245ms</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Throughput</span>
                      <span className="text-sm font-medium">1,247 req/s</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Error Rate</span>
                      <span className="text-sm font-medium text-red-500">2.3%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Uptime</span>
                      <span className="text-sm font-medium text-green-500">99.8%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            {/* Modern system maintenance actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  System Maintenance
                </CardTitle>
                <CardDescription>Perform maintenance tasks with one click</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <Button variant="default" onClick={() => toast.success('Cache cleared!')}>Clear Cache</Button>
                  <Button variant="secondary" onClick={() => toast.success('Server restarted!')}>Restart Server</Button>
                  <Button variant="outline" onClick={() => toast.success('Diagnostics complete!')}>Run Diagnostics</Button>
                  <Button variant="destructive" onClick={() => toast('System update started!')}>Update System</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    User Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Daily Active Users</span>
                      <span className="text-sm font-medium">1,247</span>
                    </div>
                    <Progress value={85} className="h-2" />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Weekly Active Users</span>
                      <span className="text-sm font-medium">3,892</span>
                    </div>
                    <Progress value={72} className="h-2" />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Monthly Active Users</span>
                      <span className="text-sm font-medium">12,456</span>
                    </div>
                    <Progress value={95} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    System Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">CPU Usage Trend</span>
                      <span className="text-sm font-medium text-green-500">-5.2%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Memory Usage Trend</span>
                      <span className="text-sm font-medium text-red-500">+2.1%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Network Usage Trend</span>
                      <span className="text-sm font-medium text-green-500">-1.8%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Error Rate Trend</span>
                      <span className="text-sm font-medium text-green-500">-0.5%</span>
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