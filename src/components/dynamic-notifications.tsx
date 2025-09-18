import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  Clock, 
  Calendar, 
  TrendingUp, 
  Award, 
  Heart, 
  Coffee, 
  Sun, 
  Moon, 
  Cloud, 
  Zap, 
  Trophy,
  Star,
  MessageSquare,
  Activity,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';

interface DynamicNotification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'reminder' | 'motivation';
  icon: any;
  color: string;
  priority: 'low' | 'normal' | 'high';
  duration?: number;
}

export function DynamicNotifications() {
  const [notifications, setNotifications] = useState<DynamicNotification[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Update time every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    generateDynamicNotifications();
  }, [currentTime]);

  const generateDynamicNotifications = () => {
    const hour = currentTime.getHours();
    const dayOfWeek = currentTime.getDay();
    const newNotifications: DynamicNotification[] = [];

    // Morning notifications (8-11 AM)
    if (hour >= 8 && hour <= 11) {
      newNotifications.push({
        id: 'morning-1',
        message: 'Good morning! Ready to tackle today\'s challenges?',
        type: 'motivation',
        icon: Sun,
        color: 'text-orange-600',
        priority: 'normal'
      });
    }

    // Afternoon notifications (12-4 PM)
    if (hour >= 12 && hour <= 16) {
      newNotifications.push({
        id: 'afternoon-1',
        message: 'Afternoon energy! How are your goals progressing today?',
        type: 'reminder',
        icon: Cloud,
        color: 'text-blue-600',
        priority: 'normal'
      });
    }

    // Evening notifications (5-7 PM)
    if (hour >= 17 && hour <= 19) {
      newNotifications.push({
        id: 'evening-1',
        message: 'Wrapping up the day? Great job on your accomplishments!',
        type: 'success',
        icon: Moon,
        color: 'text-indigo-600',
        priority: 'normal'
      });
    }

    // Weekend messages
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      newNotifications.push({
        id: 'weekend-1',
        message: 'Enjoy your weekend! Rest well and come back refreshed.',
        type: 'motivation',
        icon: Heart,
        color: 'text-red-600',
        priority: 'low'
      });
    }

    // Random motivational messages
    const motivationalMessages = [
      {
        message: 'Your dedication to quality work is noticed. Keep up the excellent performance!',
        icon: Trophy,
        color: 'text-yellow-600'
      },
      {
        message: 'Team collaboration is key to our success. Reach out if you need support.',
        icon: Heart,
        color: 'text-red-600'
      },
      {
        message: 'Innovation drives growth. Don\'t hesitate to share your ideas!',
        icon: Zap,
        color: 'text-purple-600'
      },
      {
        message: 'Work-life balance is important. Make sure to disconnect when you\'re off.',
        icon: Moon,
        color: 'text-indigo-600'
      },
      {
        message: 'Great work today! Remember to take breaks and stay hydrated.',
        icon: Coffee,
        color: 'text-blue-600'
      }
    ];

    // Add random motivational message (30% chance)
    if (Math.random() < 0.3) {
      const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
      newNotifications.push({
        id: `motivation-${Date.now()}`,
        message: randomMessage.message,
        type: 'motivation',
        icon: randomMessage.icon,
        color: randomMessage.color,
        priority: 'normal'
      });
    }

    // Performance reminders
    if (hour === 10 || hour === 14) {
      newNotifications.push({
        id: `performance-${hour}`,
        message: 'Take a moment to update your progress on current projects.',
        type: 'reminder',
        icon: TrendingUp,
        color: 'text-green-600',
        priority: 'normal'
      });
    }

    // Health and wellness reminders
    if (hour === 11 || hour === 15) {
      newNotifications.push({
        id: `wellness-${hour}`,
        message: 'Time for a quick stretch! Your health is important.',
        type: 'reminder',
        icon: Activity,
        color: 'text-green-600',
        priority: 'low'
      });
    }

    setNotifications(newNotifications);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'info': return Info;
      case 'motivation': return Star;
      case 'reminder': return Clock;
      default: return Bell;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'info': return 'bg-blue-50 border-blue-200';
      case 'motivation': return 'bg-purple-50 border-purple-200';
      case 'reminder': return 'bg-orange-50 border-orange-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {notifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ 
              duration: 0.3, 
              delay: index * 0.1,
              type: "spring",
              stiffness: 100
            }}
          >
            <Card className={`${getNotificationColor(notification.type)} hover:shadow-md transition-all duration-300`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full bg-white shadow-sm`}>
                    <notification.icon className={`h-5 w-5 ${notification.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {notification.type}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {notification.priority}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
