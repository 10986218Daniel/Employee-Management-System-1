import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  FileText, 
  MessageSquare,
  User,
  CheckCircle,
  AlertCircle,
  XCircle,
  Sparkles,
  TrendingUp,
  Activity,
  Target,
  Award,
  BarChart3,
  Zap,
  Bell,
  Star,
  Heart,
  Trophy,
  Briefcase,
  Home,
  Coffee,
  Moon,
  Sun,
  Cloud,
  Wind,
  Thermometer,
  Droplets,
  CalendarDays,
  Clock4,
  Timer,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useState } from 'react';
import { DynamicNotifications } from '@/components/dynamic-notifications';
import { useNavigate } from 'react-router-dom';

export default function EmployeeDashboard() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  

  const quickActions = [
    { title: 'Clock In/Out', icon: Clock, href: '/dashboard/employee/attendance', color: 'bg-blue-500', description: 'Track your work hours' },
    { title: 'Request Leave', icon: Calendar, href: '/dashboard/employee/requests', color: 'bg-green-500', description: 'Submit time off requests' },
    { title: 'Submit Expense', icon: DollarSign, href: '/dashboard/employee/requests', color: 'bg-purple-500', description: 'Reimburse your expenses' },
    { title: 'View Profile', icon: User, href: '/dashboard/employee/profile', color: 'bg-orange-500', description: 'Update your information' },
    { title: 'Performance', icon: TrendingUp, href: '/dashboard/employee/performance', color: 'bg-indigo-500', description: 'Track your progress' },
    { title: 'Messages', icon: MessageSquare, href: '/dashboard/employee/messages', color: 'bg-pink-500', description: 'Team communication' },
  ];

  // Dynamic admin messages that change based on time and context
  const getDynamicAdminMessage = () => {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    
    const messages = [
      {
        message: "Great work today! Remember to take breaks and stay hydrated.",
        icon: Coffee,
        color: "text-blue-600"
      },
      {
        message: "Your dedication to quality work is noticed. Keep up the excellent performance!",
        icon: Trophy,
        color: "text-yellow-600"
      },
      {
        message: "Team collaboration is key to our success. Reach out if you need support.",
        icon: Heart,
        color: "text-red-600"
      },
      {
        message: "Innovation drives growth. Don't hesitate to share your ideas!",
        icon: Zap,
        color: "text-purple-600"
      },
      {
        message: "Work-life balance is important. Make sure to disconnect when you're off.",
        icon: Moon,
        color: "text-indigo-600"
      }
    ];

    // Morning messages (8-11 AM)
    if (hour >= 8 && hour <= 11) {
      return {
        message: "Good morning! Ready to tackle today's challenges?",
        icon: Sun,
        color: "text-orange-600"
      };
    }
    
    // Afternoon messages (12-4 PM)
    if (hour >= 12 && hour <= 16) {
      return {
        message: "Afternoon energy! How are your goals progressing today?",
        icon: Cloud,
        color: "text-blue-600"
      };
    }
    
    // Evening messages (5-7 PM)
    if (hour >= 17 && hour <= 19) {
      return {
        message: "Wrapping up the day? Great job on your accomplishments!",
        icon: Moon,
        color: "text-indigo-600"
      };
    }
    
    // Weekend messages
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return {
        message: "Enjoy your weekend! Rest well and come back refreshed.",
        icon: Heart,
        color: "text-red-600"
      };
    }
    
    // Default random message
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const adminMessage = getDynamicAdminMessage();

  const recentActivity = [
    { type: 'attendance', message: 'Clocked in at 9:00 AM', time: '2 hours ago', status: 'success', icon: CheckCircle2 },
    { type: 'leave', message: 'Leave request approved', time: '1 day ago', status: 'success', icon: CheckCircle },
    { type: 'expense', message: 'Expense report pending', time: '2 days ago', status: 'pending', icon: AlertTriangle },
    { type: 'performance', message: 'Performance review completed', time: '3 days ago', status: 'success', icon: TrendingUp },
    { type: 'training', message: 'Training session scheduled', time: '1 week ago', status: 'info', icon: Info },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Welcome back, {userProfile?.first_name}!
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your work today.
        </p>
        {/* Salary Display */}
        <div className="mt-4 flex flex-col items-center">
          <span className="font-semibold text-lg">Current Salary:</span>
          <span className="text-2xl text-green-700 font-bold">{userProfile?.salary ? `₵${userProfile.salary.toLocaleString()}` : 'Not set'}</span>
        </div>
        
      </motion.div>

      {/* Dynamic Admin Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full bg-white shadow-md`}>
                <adminMessage.icon className={`h-6 w-6 ${adminMessage.color}`} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 mb-1">Message from Management</h3>
                <p className="text-gray-700">{adminMessage.message}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quickActions.map((action, index) => (
          <motion.div
            key={action.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card 
              className="hover:shadow-lg transition-all duration-300 cursor-pointer group hover:scale-105"
              onClick={() => navigate(action.href)}
            >
              <CardContent className="p-6 text-center">
                <div className={`w-16 h-16 ${action.color} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                  <action.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{action.title}</h3>
                <p className="text-sm text-muted-foreground">{action.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Dynamic Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Live Updates
              </CardTitle>
              <CardDescription>Real-time notifications and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <DynamicNotifications />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Your latest workplace activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                  >
                    <div className={`p-2 rounded-full ${
                      activity.status === 'success' ? 'bg-green-100' : 
                      activity.status === 'pending' ? 'bg-yellow-100' : 
                      'bg-blue-100'
                    }`}>
                      <activity.icon className={`h-4 w-4 ${
                        activity.status === 'success' ? 'text-green-600' : 
                        activity.status === 'pending' ? 'text-yellow-600' : 
                        'text-blue-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                    <Badge variant={activity.status === 'success' ? 'default' : 'secondary'}>
                      {activity.status}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Hours this week</span>
                <span className="font-semibold">40.0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Leave balance</span>
                <span className="font-semibold">15 days</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Pending requests</span>
                <span className="font-semibold">2</span>
              </div>
              <Button className="w-full mt-4">
                View Full Report
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}