import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Clock, Calendar as CalendarIcon, MapPin, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'react-hot-toast';

export default function EmployeeAttendance() {
  const { user, userProfile } = useAuth();
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTodayAttendance();
    loadAttendanceHistory();
    
    // Set up real-time subscription for attendance updates
    const attendanceChannel = supabase
      .channel('employee_attendance_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'attendance',
        filter: `employee_id=eq.${user?.id}`
      }, (payload) => {
        console.log('Attendance update received:', payload);
        loadTodayAttendance();
        loadAttendanceHistory();
      })
      .subscribe();

    return () => {
      attendanceChannel.unsubscribe();
    };
  }, [user?.id]);

  const loadTodayAttendance = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', user?.id)
        .eq('date', today)
        .single();

      setTodayAttendance(data);
      setApprovalStatus((data as any)?.approval_status || null);
    } catch (error) {
      console.log('No attendance record for today');
    }
  };

  const loadAttendanceHistory = async () => {
    try {
      const { data } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', user?.id)
        .order('date', { ascending: false })
        .limit(10);

      setAttendanceHistory(data || []);
    } catch (error) {
      console.error('Error loading attendance history:', error);
    }
  };

  const handleClockIn = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date().toTimeString().split(' ')[0];

      console.log('Clocking in:', { employee_id: user?.id, date: today, check_in_time: now });

      const { error } = await supabase
        .from('attendance')
        .insert({
          employee_id: user?.id,
          date: today,
          check_in_time: now,
          status: 'present'
        });

      if (error) {
        console.error('Clock in error:', error);
        throw error;
      }

      // Notify HR about the clock in
      try {
        // Get all HR users and send them notifications
        const { data: hrUsers } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'hr');

        if (hrUsers && hrUsers.length > 0) {
          const notifications = hrUsers.map(hrUser => ({
            user_id: hrUser.id,
            title: 'Employee Clocked In',
            message: `${userProfile?.first_name} ${userProfile?.last_name} clocked in at ${now}`,
            type: 'attendance',
            action_url: '/dashboard/hr',
          }));

          await supabase.from('notifications').insert(notifications);
        }
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
      }

      toast.success('Clocked in successfully!');
      loadTodayAttendance();
    } catch (error: any) {
      console.error('Clock in failed:', error);
      toast.error(error.message || 'Failed to clock in');
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!todayAttendance) return;

    setLoading(true);
    try {
      const now = new Date().toTimeString().split(' ')[0];

      console.log('Clocking out:', { attendance_id: todayAttendance.id, check_out_time: now });

      const { error } = await supabase
        .from('attendance')
        .update({ check_out_time: now })
        .eq('id', todayAttendance.id);

      if (error) {
        console.error('Clock out error:', error);
        throw error;
      }

      // Notify HR about the clock out
      try {
        const { data: hrUsers } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'hr');

        if (hrUsers && hrUsers.length > 0) {
          const notifications = hrUsers.map(hrUser => ({
            user_id: hrUser.id,
            title: 'Employee Clocked Out',
            message: `${userProfile?.first_name} ${userProfile?.last_name} clocked out at ${now}`,
            type: 'attendance',
            action_url: '/dashboard/hr',
          }));

          await supabase.from('notifications').insert(notifications);
        }
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
      }

      toast.success('Clocked out successfully!');
      loadTodayAttendance();
    } catch (error: any) {
      console.error('Clock out failed:', error);
      toast.error(error.message || 'Failed to clock out');
    } finally {
      setLoading(false);
    }
  };

  const calculateWorkingHours = (checkIn: string, checkOut: string | null) => {
    if (!checkOut) return 'In progress...';

    const checkInTime = new Date(`2000-01-01T${checkIn}`);
    const checkOutTime = new Date(`2000-01-01T${checkOut}`);
    const diffMs = checkOutTime.getTime() - checkInTime.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${diffHours}h ${diffMins}m`;
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-foreground mb-2">Attendance Tracking</h1>
        <p className="text-muted-foreground">Track your working hours and attendance</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Today's Attendance
              </CardTitle>
              <CardDescription>
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {todayAttendance ? (
                <div className="space-y-4">
                  {approvalStatus && (
                    <div className={`p-3 rounded-md text-sm ${
                      approvalStatus === 'approved'
                        ? 'bg-green-50 text-green-700'
                        : approvalStatus === 'rejected'
                        ? 'bg-red-50 text-red-700'
                        : 'bg-yellow-50 text-yellow-700'
                    }`}>
                      Attendance {approvalStatus}
                    </div>
                  )}
                  <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Clock In Time</span>
                    </div>
                    <span className="text-lg font-bold text-green-600">
                      {todayAttendance.check_in_time}
                    </span>
                  </div>

                  {todayAttendance.check_out_time ? (
                    <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-blue-600" />
                        <span className="font-medium">Clock Out Time</span>
                      </div>
                      <span className="text-lg font-bold text-blue-600">
                        {todayAttendance.check_out_time}
                      </span>
                    </div>
                  ) : (
                    <Button 
                      onClick={handleClockOut} 
                      disabled={loading}
                      className="w-full"
                      size="lg"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Clock Out
                    </Button>
                  )}

                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <span className="font-medium">Working Hours</span>
                    <span className="text-lg font-bold">
                      {calculateWorkingHours(todayAttendance.check_in_time, todayAttendance.check_out_time)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Ready to start your day?</h3>
                  <p className="text-muted-foreground mb-6">Clock in to begin tracking your attendance</p>
                  <Button 
                    onClick={handleClockIn} 
                    disabled={loading}
                    size="lg"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Clock In
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Attendance History</CardTitle>
            <CardDescription>Your recent attendance records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {attendanceHistory.length > 0 ? (
                attendanceHistory.map((record: any) => (
                  <div key={record.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">
                          {new Date(record.date).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {record.check_in_time} - {record.check_out_time || 'Not clocked out'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={record.status === 'present' ? 'default' : 'secondary'}>
                        {record.status}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-1">
                        {calculateWorkingHours(record.check_in_time, record.check_out_time)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No attendance records found
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}