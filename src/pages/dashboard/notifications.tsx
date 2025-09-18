import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  BellRing,
  Check,
  Info,
  AlertTriangle,
  CheckCircle,
  X,
  Calendar,
  Clock,
  User,
  FileText,
  Award,
  Settings,
  Filter,
  Search,
  RefreshCw,
  Trash2,
  Archive,
  Star,
  StarOff,
  MoreHorizontal,
  Eye,
  EyeOff,
  Mail,
  MailOpen,
  Pin,
  PinOff,
  Volume2,
  VolumeX,
  Zap,
  TrendingUp,
  TrendingDown,
  Activity,
  MessageSquare,
  Clock4,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'announcement' | 'attendance' | 'request' | 'performance';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  read: boolean;
  pinned?: boolean;
  action_url?: string;
  created_at: string;
  sender?: {
    first_name: string;
    last_name: string;
    role: string;
    avatar_url?: string;
  };
}

export default function Notifications() {
  const { user, userProfile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'all' | 'unread' | 'pinned'>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [notificationStats, setNotificationStats] = useState({
    total: 0,
    unread: 0,
    pinned: 0,
    urgent: 0,
    today: 0
  });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Dynamic notification messages that change over time
  const dynamicMessages = [
    {
      title: 'System Maintenance Scheduled',
      message: 'Scheduled maintenance will occur tonight from 2:00 AM to 6:00 AM. Some systems may be temporarily unavailable.',
      type: 'warning' as const,
      priority: 'high' as const
    },
    {
      title: 'New Company Policy Update',
      message: 'A new remote work policy has been published. Please review the updated guidelines in the employee handbook.',
      type: 'announcement' as const,
      priority: 'normal' as const
    },
    {
      title: 'Performance Review Reminder',
      message: 'Your quarterly performance review is due next week. Please complete the self-assessment form.',
      type: 'performance' as const,
      priority: 'high' as const
    },
    {
      title: 'Team Meeting Today',
      message: 'Don\'t forget about the weekly team meeting at 3:00 PM today. Agenda has been updated.',
      type: 'info' as const,
      priority: 'normal' as const
    },
    {
      title: 'Holiday Schedule Update',
      message: 'The holiday schedule for December has been updated. Please check your calendar for the new dates.',
      type: 'announcement' as const,
      priority: 'normal' as const
    }
  ];

  // Generate dynamic notifications based on time and user activity
  const generateDynamicNotifications = () => {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    
    const dynamicNotifications: Notification[] = [];

    // Morning notifications (8-10 AM)
    if (hour >= 8 && hour <= 10) {
      dynamicNotifications.push({
        id: `dynamic-${Date.now()}-1`,
        user_id: user?.id || '',
        title: 'Good Morning!',
        message: 'Welcome to a new day! Don\'t forget to clock in and check your daily tasks.',
        type: 'info',
        priority: 'normal',
        read: false,
        pinned: false,
        created_at: new Date().toISOString()
      });
    }

    // Afternoon productivity reminder (2-3 PM)
    if (hour >= 14 && hour <= 15) {
      dynamicNotifications.push({
        id: `dynamic-${Date.now()}-2`,
        user_id: user?.id || '',
        title: 'Afternoon Check-in',
        message: 'How\'s your day going? Take a moment to update your progress on current projects.',
        type: 'info',
        priority: 'low',
        read: false,
        pinned: false,
        created_at: new Date().toISOString()
      });
    }

    // End of day reminder (5-6 PM)
    if (hour >= 17 && hour <= 18) {
      dynamicNotifications.push({
        id: `dynamic-${Date.now()}-3`,
        user_id: user?.id || '',
        title: 'End of Day Reminder',
        message: 'Don\'t forget to clock out and update your daily progress before leaving.',
        type: 'info',
        priority: 'normal',
        read: false,
        pinned: false,
        created_at: new Date().toISOString()
      });
    }

    // Weekend preparation (Friday afternoon)
    if (dayOfWeek === 5 && hour >= 15) {
      dynamicNotifications.push({
        id: `dynamic-${Date.now()}-4`,
        user_id: user?.id || '',
        title: 'Weekend Preparation',
        message: 'Have a great weekend! Remember to complete any pending tasks before you go.',
        type: 'success',
        priority: 'normal',
        read: false,
        pinned: false,
        created_at: new Date().toISOString()
      });
    }

    // Random dynamic message from the pool
    const randomMessage = dynamicMessages[Math.floor(Math.random() * dynamicMessages.length)];
    if (Math.random() < 0.3) { // 30% chance to add a random message
      dynamicNotifications.push({
        id: `dynamic-${Date.now()}-5`,
        user_id: user?.id || '',
        title: randomMessage.title,
        message: randomMessage.message,
        type: randomMessage.type,
        priority: randomMessage.priority,
        read: false,
        pinned: false,
        created_at: new Date().toISOString()
      });
    }

    return dynamicNotifications;
  };

  // Mock data for demonstration with dynamic content
  const mockNotifications: Notification[] = [
    {
      id: '1',
      user_id: user?.id || '',
      title: 'Leave Request Approved',
      message: 'Your leave request for January 15-20, 2024 has been approved by HR.',
      type: 'success',
      priority: 'normal',
      read: false,
      pinned: false,
      created_at: new Date().toISOString(),
      sender: {
        first_name: 'Sarah',
        last_name: 'Johnson',
        role: 'hr',
        avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
      },
      metadata: {
        request_id: 'req-001',
        department: 'Engineering'
      }
    },
    {
      id: '2',
      user_id: user?.id || '',
      title: 'Attendance Alert',
      message: 'You clocked in at 9:15 AM today. Consider arriving earlier to maintain optimal attendance.',
      type: 'attendance',
      priority: 'normal',
      read: true,
      pinned: true,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      metadata: {
        attendance_id: 'att-001'
      }
    },
    {
      id: '3',
      user_id: user?.id || '',
      title: 'Performance Review Due',
      message: 'Your quarterly performance review is due next week. Please complete the self-assessment form.',
      type: 'performance',
      priority: 'high',
      read: false,
      pinned: false,
      created_at: new Date(Date.now() - 7200000).toISOString(),
      sender: {
        first_name: 'Lisa',
        last_name: 'Brown',
        role: 'hr',
        avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
      },
      metadata: {
        performance_score: 85
      }
    },
    {
      id: '4',
      user_id: user?.id || '',
      title: 'Equipment Request Approved',
      message: 'Your request for a new laptop has been approved. IT will contact you for setup.',
      type: 'request',
      priority: 'normal',
      read: false,
      pinned: false,
      created_at: new Date(Date.now() - 10800000).toISOString(),
      sender: {
        first_name: 'David',
        last_name: 'Wilson',
        role: 'admin',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
      },
      metadata: {
        request_id: 'req-002'
      }
    }
  ];

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Add dynamic notifications
      const dynamicNotifs = generateDynamicNotifications();
      setNotifications(prev => [...dynamicNotifs, ...prev, ...mockNotifications]);
    }
  }, [user]);

  useEffect(() => {
    filterNotifications();
    updateNotificationStats();
  }, [notifications, searchTerm, typeFilter, priorityFilter, statusFilter, viewMode]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        fetchNotifications();
        // Add new dynamic notifications periodically
        const newDynamicNotifs = generateDynamicNotifications();
        setNotifications(prev => [...newDynamicNotifs, ...prev]);
      }, 60000); // Refresh every minute
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh]);

  const updateNotificationStats = () => {
    const total = notifications.length;
    const unread = notifications.filter(n => !n.read).length;
    const pinned = notifications.filter(n => n.pinned).length;
    const urgent = notifications.filter(n => n.priority === 'urgent').length;
    const today = notifications.filter(n => {
      const notifDate = new Date(n.created_at);
      const todayDate = new Date();
      return notifDate.toDateString() === todayDate.toDateString();
    }).length;

    setNotificationStats({ total, unread, pinned, urgent, today });
  };

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Merge with existing notifications, avoiding duplicates, and enrich with local-only fields
      setNotifications(prev => {
        const existingIds = new Set(prev.map(n => n.id));
        const normalized = (data || []).map((n: any) => ({
          id: n.id,
          user_id: n.user_id,
          title: n.title,
          message: n.message,
          type: (n.type || 'info') as Notification['type'],
          priority: 'normal' as const,
          read: !!n.read,
          pinned: false,
          action_url: n.action_url || undefined,
          created_at: n.created_at || new Date().toISOString(),
        }));
        const newNotifs = normalized.filter(n => !existingIds.has(n.id));
        return [...newNotifs, ...prev];
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterNotifications = () => {
    let filtered = notifications;

    // Apply view mode filter
    if (viewMode === 'unread') {
      filtered = filtered.filter(notification => !notification.read);
    } else if (viewMode === 'pinned') {
      filtered = filtered.filter(notification => notification.pinned);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(notification =>
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(notification => notification.type === typeFilter);
    }

    // Apply priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(notification => notification.priority === priorityFilter);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(notification => 
        statusFilter === 'read' ? notification.read : !notification.read
      );
    }

    setFilteredNotifications(filtered);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
      
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      );
      toast.success('Notification marked as read');
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Update locally even if API fails
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      );
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user?.id)
        .eq('read', false);

      if (error) throw error;
      
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      // Update locally even if API fails
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
    }
  };

  const togglePin = async (notificationId: string) => {
    // Pinning is a local-only feature
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, pinned: !notification.pinned } 
          : notification
      )
    );
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      
      setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      // Remove locally even if API fails
      setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <X className="h-4 w-4 text-red-500" />;
      case 'announcement': return <Bell className="h-4 w-4 text-blue-500" />;
      case 'attendance': return <Clock4 className="h-4 w-4 text-purple-500" />;
      case 'request': return <FileText className="h-4 w-4 text-orange-500" />;
      case 'performance': return <TrendingUp className="h-4 w-4 text-indigo-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationVariant = (type: string) => {
    switch (type) {
      case 'success': return 'default';
      case 'warning': return 'secondary';
      case 'error': return 'destructive';
      case 'announcement': return 'outline';
      case 'attendance': return 'secondary';
      case 'request': return 'outline';
      case 'performance': return 'default';
      default: return 'secondary';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority: string) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const notificationDate = new Date(dateString);
    const diffMs = now.getTime() - notificationDate.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return notificationDate.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Notifications Center
        </h1>
        <p className="text-muted-foreground">
          Stay updated with important messages and announcements.
        </p>
      </motion.div>

      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-5 gap-4"
      >
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Bell className="h-6 w-6 text-blue-500" />
            </div>
            <p className="text-2xl font-bold">{notificationStats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Eye className="h-6 w-6 text-green-500" />
            </div>
            <p className="text-2xl font-bold">{notificationStats.unread}</p>
            <p className="text-xs text-muted-foreground">Unread</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Pin className="h-6 w-6 text-purple-500" />
            </div>
            <p className="text-2xl font-bold">{notificationStats.pinned}</p>
            <p className="text-xs text-muted-foreground">Pinned</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <p className="text-2xl font-bold">{notificationStats.urgent}</p>
            <p className="text-xs text-muted-foreground">Urgent</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Calendar className="h-6 w-6 text-orange-500" />
            </div>
            <p className="text-2xl font-bold">{notificationStats.today}</p>
            <p className="text-xs text-muted-foreground">Today</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Header with controls */}
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
                  <Bell className="h-5 w-5" />
                  <span className="font-semibold">Notifications</span>
                  {notificationStats.unread > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {notificationStats.unread} unread
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                  >
                    {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAutoRefresh(!autoRefresh)}
                  >
                    <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={markAllAsRead}>
                  <Check className="h-4 w-4 mr-2" />
                  Mark all read
                </Button>
                <Button variant="outline" size="sm" onClick={fetchNotifications}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="announcement">Announcement</SelectItem>
                    <SelectItem value="attendance">Attendance</SelectItem>
                    <SelectItem value="request">Request</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notifications List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All ({notificationStats.total})</TabsTrigger>
            <TabsTrigger value="unread">Unread ({notificationStats.unread})</TabsTrigger>
            <TabsTrigger value="pinned">Pinned ({notificationStats.pinned})</TabsTrigger>
          </TabsList>

          <TabsContent value={viewMode} className="space-y-4">
            <Card>
              <CardContent className="p-0">
                <ScrollArea className="h-96">
                  <div className="space-y-2 p-4">
                    <AnimatePresence>
                      {filteredNotifications.length > 0 ? (
                        filteredNotifications.map((notification) => (
                          <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                              notification.read ? 'bg-muted/50' : 'bg-background'
                            } ${notification.pinned ? 'border-blue-200 bg-blue-50/50' : ''}`}
                          >
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0">
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="font-medium text-sm">
                                        {notification.title}
                                      </h4>
                                      <Badge 
                                        variant={getNotificationVariant(notification.type)}
                                        className="text-xs"
                                      >
                                        {notification.type}
                                      </Badge>
                                      <Badge 
                                        className={`text-xs ${getPriorityColor(notification.priority)}`}
                                      >
                                        {getPriorityLabel(notification.priority)}
                                      </Badge>
                                      {notification.pinned && (
                                        <Pin className="h-3 w-3 text-blue-500" />
                                      )}
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-2">
                                      {notification.message}
                                    </p>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                      <span>{formatTimeAgo(notification.created_at)}</span>
                                      {/* Sender attribution omitted: not stored in DB */}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {!notification.read && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => markAsRead(notification.id)}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    )}
                                      <Button
                                      variant="ghost"
                                        size="sm"
                                      onClick={() => togglePin(notification.id)}
                                    >
                                      {notification.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                      size="sm"
                                        onClick={() => deleteNotification(notification.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No notifications found</p>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}