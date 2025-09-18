import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Users, 
  Calendar, 
  FileText, 
  DollarSign,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  UserPlus,
  Award,
  BarChart3,
  Target,
  Building2,
  Mail,
  Phone,
  MapPin,
  Star,
  Activity,
  PieChart,
  LineChart,
  Filter,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  CheckCircle2,
  XCircle,
  Timer,
  CalendarDays,
  Users2,
  TrendingDown,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  position: string;
  department?: string;
  department_id?: string;
  hire_date?: string;
  is_active: boolean;
  avatar_url?: string;
  performance_score?: number;
  attendance_rate?: number;
}

interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  status: string;
  location_lat?: number;
  location_lng?: number;
  notes?: string;
  approval_status?: 'pending' | 'approved' | 'rejected';
  approved_by?: string | null;
  approved_at?: string | null;
  employee?: {
    first_name: string;
    last_name: string;
    email?: string;
    department?: string;
    position: string;
    avatar_url?: string;
  };
}

interface RecruitmentPipeline {
  id: string;
  position: string;
  department: string;
  candidates: number;
  status: 'open' | 'in_review' | 'interviewing' | 'offered' | 'hired';
  created_at: string;
}

export default function HRDashboard() {
  const { userProfile } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [recruitmentPipeline, setRecruitmentPipeline] = useState<RecruitmentPipeline[]>([]);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    pendingRequests: 0,
    averagePerformance: 0,
    turnoverRate: 0,
    recruitmentOpenings: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
    averageWorkingHours: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [clockTick, setClockTick] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');

  useEffect(() => {
    const id = setInterval(() => setClockTick(Date.now()), 30000); // refresh every 30s
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    loadDashboardData();
    
    // Set up real-time subscriptions for multiple tables
    const attendanceChannel = supabase
      .channel('attendance_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'attendance'
      }, (payload) => {
        console.log('Attendance update received:', payload);
        setIsUpdating(true);
        
        // Immediately update the UI for better real-time experience
        if (payload.eventType === 'INSERT') {
          // Add new attendance record immediately
          const newRecord = payload.new;
          console.log('New attendance record:', newRecord);
          
          // Update attendance records immediately
                  setAttendanceRecords(prev => {
            const existingIndex = prev.findIndex(r => r.employee_id === newRecord.employee_id);
            if (existingIndex >= 0) {
              // Update existing record
              const updated = [...prev];
              updated[existingIndex] = { ...updated[existingIndex], ...newRecord } as AttendanceRecord;
              return updated;
            } else {
              // Add new record
              return [...prev, newRecord as AttendanceRecord];
            }
          });
          
          // Update stats immediately
                  setStats(prev => ({
                    ...prev,
                    presentToday: prev.presentToday + 1,
                    absentToday: Math.max(0, prev.absentToday - 1)
                  }));
          
          // Show toast notification
          toast.success(`Employee clocked in at ${new Date().toLocaleTimeString()}`, {
            duration: 3000,
            position: 'top-right'
          });
          
          const activity = {
            id: Date.now(),
            type: 'clock_in',
            message: 'Employee clocked in',
            timestamp: new Date().toISOString(),
            data: payload.new
          };
          setRecentActivity(prev => [activity, ...prev.slice(0, 9)]);
        } else if (payload.eventType === 'UPDATE') {
          // Update existing record immediately
          const updatedRecord = payload.new;
          console.log('Updated attendance record:', updatedRecord);
          
          setAttendanceRecords(prev => {
            const updated = prev.map(record => {
              if (record.employee_id === updatedRecord.employee_id) {
                return { ...record, ...updatedRecord };
              }
              return record;
            });
            return updated;
          });
          
          if (updatedRecord.check_out_time) {
            // Show toast notification for clock out
            toast.info(`Employee clocked out at ${new Date().toLocaleTimeString()}`, {
              duration: 3000,
              position: 'top-right'
            });
            
            const activity = {
              id: Date.now(),
              type: 'clock_out',
              message: 'Employee clocked out',
              timestamp: new Date().toISOString(),
              data: updatedRecord
            };
            setRecentActivity(prev => [activity, ...prev.slice(0, 9)]);
          }
        }
        
        // Also reload data to ensure consistency
        loadDashboardData().finally(() => {
          setIsUpdating(false);
        });
      })
      .subscribe((status) => {
        console.log('Attendance channel status:', status);
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
        } else if (status === 'CHANNEL_ERROR') {
          setConnectionStatus('disconnected');
        }
      });

    const profilesChannel = supabase
      .channel('profiles_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles'
      }, (payload) => {
        console.log('Profile update received:', payload);
        loadDashboardData();
      })
      .subscribe();

    const requestsChannel = supabase
      .channel('requests_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'requests'
      }, (payload) => {
        console.log('Request update received:', payload);
        loadDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(attendanceChannel);
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(requestsChannel);
    };
  }, []);

  // Reload attendance when date changes
  useEffect(() => {
    loadAttendanceData();
  }, [selectedDate]);

  const loadDashboardData = async () => {
    try {
      // Load employees
      const { data: employeesData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      // Load pending requests
      const { data: requestsData } = await supabase
        .from('requests')
        .select('*')
        .eq('status', 'pending');

      setEmployees(employeesData || []);
      setRecruitmentPipeline([]);

      // Load attendance data
      await loadAttendanceData();

      // Calculate comprehensive stats
      const activeEmployees = employeesData?.filter(emp => emp.is_active)?.length || 0;
      const inactiveEmployees = employeesData?.filter(emp => !emp.is_active)?.length || 0;
      const totalEmployees = employeesData?.length || 0;
      
      // Calculate average performance (mock for now)
      const avgPerformance = employeesData?.reduce((acc, emp) => acc + (Math.floor(Math.random() * 40) + 60), 0) / totalEmployees || 0;
      
      // Calculate turnover rate (mock calculation)
      const turnoverRate = totalEmployees > 0 ? (inactiveEmployees / totalEmployees) * 100 : 0;

      setStats(prev => ({
        ...prev,
        totalEmployees,
        activeEmployees,
        pendingRequests: requestsData?.length || 0,
        averagePerformance: Math.round(avgPerformance),
        turnoverRate: Math.round(turnoverRate * 10) / 10,
        recruitmentOpenings: 0
      }));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceData = async () => {
    try {
      console.log('Loading attendance data for date:', selectedDate);
      
      // Ensure employees list exists
      let allEmployees = employees;
      if (!allEmployees || allEmployees.length === 0) {
        console.log('Loading employees data...');
        const { data: employeesData, error: employeesError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (employeesError) {
          console.error('Error loading employees:', employeesError);
        }
        
        allEmployees = employeesData || [];
        console.log('Loaded employees:', allEmployees.length);
        setEmployees(allEmployees as any);
      }

      // Fetch attendance for the selected date
      console.log('Fetching attendance data...');
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select(`
          *,
          employee:profiles!attendance_employee_id_fkey(
            first_name, 
            last_name, 
            email,
            department_id, 
            position, 
            avatar_url
          )
        `)
        .eq('date', selectedDate)
        .order('check_in_time', { ascending: false });

      if (attendanceError) {
        console.error('Error loading attendance:', attendanceError);
      }
      
      console.log('Attendance data loaded:', attendanceData?.length || 0, 'records');

      // If no records for selected date, fallback to most recent date with data
      if (!attendanceData || attendanceData.length === 0) {
        const { data: latest } = await supabase
          .from('attendance')
          .select('date')
          .order('date', { ascending: false })
          .limit(1);
        if (latest && latest[0]?.date && latest[0].date !== selectedDate) {
          setSelectedDate(latest[0].date as any);
          return; // effect will reload
        }
      }

      // Index by employee_id
      const byEmployeeId = new Map<string, any>();
      (attendanceData || []).forEach((r: any) => byEmployeeId.set(r.employee_id, r));

      // Merge: include absent placeholders for employees without records (includes HR)
      const merged = allEmployees.map((emp: any) => {
        const existing = byEmployeeId.get(emp.id);
        if (existing) {
          // Prefer local avatar if present
          const localProfileKey = `userProfile_${emp.id}`;
          const localProfile = localStorage.getItem(localProfileKey);
          if (localProfile) {
            try {
              const localData = JSON.parse(localProfile);
              if (localData.avatar_url && localData.avatar_url.startsWith('blob:')) {
                existing.employee = { ...(existing.employee || {}), avatar_url: localData.avatar_url };
              }
            } catch {}
          }
          return existing;
        }
        return {
          id: `absent-${emp.id}-${selectedDate}`,
          employee_id: emp.id,
          date: selectedDate,
          check_in_time: null,
          check_out_time: null,
          status: 'absent',
          location_lat: null,
          location_lng: null,
          notes: null,
          approval_status: null,
          employee: {
            first_name: emp.first_name,
            last_name: emp.last_name,
            email: emp.email,
            department: emp.department_id,
            position: emp.position,
            avatar_url: emp.avatar_url,
          },
        } as any;
      });

      console.log('Merged attendance records:', merged.length);
      console.log('Sample merged record:', merged[0]);

      setAttendanceRecords(merged as any);
      // Keep a consistent ordering
      setAttendanceRecords(prev => sortRecords(prev));

      // Recompute stats from merged list
      const present = merged.filter((r: any) => !!r.check_in_time).length;
      const absent = (allEmployees.length) - present;
      const late = merged.filter((r: any) => {
        if (!r.check_in_time) return false;
        const checkInTime = new Date(`2000-01-01T${r.check_in_time}`);
        const workStartTime = new Date('2000-01-01T09:00:00');
        return checkInTime > workStartTime;
      }).length;

      const totalWorkingHours = merged.reduce((acc: number, r: any) => {
        if (r.check_in_time && r.check_out_time) {
          const inDt = new Date(`${(r.date || selectedDate)}T${r.check_in_time}`);
          const outDt = new Date(`${(r.date || selectedDate)}T${r.check_out_time}`);
          return acc + Math.max(0, (outDt.getTime() - inDt.getTime()) / (1000 * 60 * 60));
        }
        return acc;
      }, 0);

      const avgWorkingHours = present > 0 ? totalWorkingHours / present : 0;

      setStats(prev => ({
        ...prev,
        totalEmployees: allEmployees.length,
        activeEmployees: allEmployees.filter((e: any) => e.is_active).length,
        presentToday: present,
        absentToday: absent,
        lateToday: late,
        averageWorkingHours: Math.round(avgWorkingHours * 10) / 10
      }));
    } catch (error) {
      console.error('Error loading attendance data:', error);
    }
  };

  // Notify an employee about HR decision on attendance
  const notifyEmployee = async (
    employeeId: string,
    title: string,
    message: string,
  ) => {
    try {
      const { error } = await supabase.from('notifications').insert({
        user_id: employeeId,
        title,
        message,
        type: 'attendance',
        action_url: '/dashboard/employee/attendance',
      });
      if (error) throw error;
    } catch (err) {
      console.error('Failed to send notification:', err);
    }
  };

  const approveAttendance = async (record: AttendanceRecord) => {
    try {
      const { error: updateError } = await supabase
        .from('attendance')
        .update({
          approval_status: 'approved',
          approved_by: userProfile?.id,
          approved_at: new Date().toISOString(),
        } as any)
        .eq('id', record.id);
      if (updateError) throw updateError;

      await notifyEmployee(
        record.employee_id,
        'Attendance Approved',
        `Your attendance for ${new Date(selectedDate).toLocaleDateString()} has been approved by HR.`
      );
      toast.success('Attendance approved');
      loadAttendanceData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to approve attendance');
    }
  };

  const rejectAttendance = async (record: AttendanceRecord) => {
    try {
      const { error: updateError } = await supabase
        .from('attendance')
        .update({
          approval_status: 'rejected',
          approved_by: userProfile?.id,
          approved_at: new Date().toISOString(),
        } as any)
        .eq('id', record.id);
      if (updateError) throw updateError;

      await notifyEmployee(
        record.employee_id,
        'Attendance Rejected',
        `Your attendance for ${new Date(selectedDate).toLocaleDateString()} has been rejected by HR.`
      );
      toast.success('Attendance rejected');
      loadAttendanceData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reject attendance');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Derive streamlined live status from clock in/out (with priority for sorting)
  const getEffectiveStatus = (record: any) => {
    if (record.check_in_time && !record.check_out_time) return { label: 'Active', color: 'bg-green-100 text-green-800', priority: 0 };
    if (record.check_in_time && record.check_out_time) return { label: 'Closed', color: 'bg-blue-100 text-blue-800', priority: 1 };
    return { label: 'Inactive', color: 'bg-gray-100 text-gray-800', priority: 2 };
  };

  // Sort: Active -> Closed -> Absent, then by latest activity (check_out > check_in), then by name
  const sortRecords = (records: any[]) => {
    const getMostRecentTs = (r: any) => {
      if (r.check_out_time) return Date.parse(`2000-01-01T${r.check_out_time}`) || 0;
      if (r.check_in_time) return Date.parse(`2000-01-01T${r.check_in_time}`) || 0;
      return 0;
    };
    return [...records].sort((a, b) => {
      const pa = getEffectiveStatus(a).priority;
      const pb = getEffectiveStatus(b).priority;
      if (pa !== pb) return pa - pb;
      const tb = getMostRecentTs(b) - getMostRecentTs(a);
      if (tb !== 0) return tb;
      const na = `${a?.employee?.first_name || ''}${a?.employee?.last_name || ''}`.toLowerCase();
      const nb = `${b?.employee?.first_name || ''}${b?.employee?.last_name || ''}`.toLowerCase();
      return na.localeCompare(nb);
    });
  };

  const calculateWorkingHours = (checkIn: string, checkOut: string | null) => {
    if (!checkIn) return '—';

    const checkInTime = new Date(`2000-01-01T${checkIn}`);
    if (!checkOut) {
      // Fallback when only times are given without date context
      const now = new Date();
      const sameDayIn = new Date(`2000-01-01T${checkIn}`);
      const nowSameBase = new Date(`2000-01-01T${now.toTimeString().split(' ')[0]}`);
      const diffMs = Math.max(0, nowSameBase.getTime() - sameDayIn.getTime());
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${diffHours}h ${diffMins}m`;
    }

    const checkOutTime = new Date(`2000-01-01T${checkOut}`);
    const diffMs = checkOutTime.getTime() - checkInTime.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${diffHours}h ${diffMins}m`;
  };

  // More accurate live calculation that uses record.date if available
  const calculateWorkingHoursLive = (record: any) => {
    if (!record?.check_in_time) return '—';
    const baseDate = record?.date || selectedDate;
    const inDt = new Date(`${baseDate}T${record.check_in_time}`);
    if (!record.check_out_time) {
      const now = new Date();
      const diffMs = Math.max(0, now.getTime() - inDt.getTime());
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${diffHours}h ${diffMins}m`;
    }
    const outDt = new Date(`${baseDate}T${record.check_out_time}`);
    const diffMs = Math.max(0, outDt.getTime() - inDt.getTime());
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours}h ${diffMins}m`;
  };

  const isLate = (checkInTime: string) => {
    const checkIn = new Date(`2000-01-01T${checkInTime}`);
    const workStart = new Date('2000-01-01T09:00:00');
    return checkIn > workStart;
  };

  // Lightweight XLSX export via dynamic CDN SheetJS loader with CSV fallback
  const exportToXlsx = async (rows: any[], filename: string) => {
    try {
      // @ts-ignore
      const XLSX = (window as any).XLSX || await (async () => {
        const res = await fetch('https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js');
        const scriptText = await res.text();
        const script = document.createElement('script');
        script.text = scriptText;
        document.body.appendChild(script);
        // @ts-ignore
        return (window as any).XLSX;
      })();

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
      XLSX.writeFile(workbook, `${filename}.xlsx`);
      toast.success('Exported XLSX successfully');
    } catch (err) {
      console.error('XLSX export failed, falling back to CSV', err);
      try {
        const headers = Object.keys(rows[0] || {});
        const escapeCsv = (val: any) => {
          const s = String(val ?? '');
          if (s.includes(',') || s.includes('"') || s.includes('\n')) {
            return '"' + s.replace(/"/g, '""') + '"';
          }
          return s;
        };
        const csv = [headers.join(',')]
          .concat(rows.map(r => headers.map(h => escapeCsv(r[h])).join(',')))
          .join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('Exported CSV successfully');
      } catch (e) {
        toast.error('Failed to export data');
      }
    }
  };

  const exportAttendanceToPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(20);
      doc.text('Employee Attendance Report', 14, 22);
      
      // Add date
      doc.setFontSize(12);
      doc.text(`Date: ${new Date(selectedDate).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}`, 14, 32);
      
      // Add summary stats
      doc.setFontSize(10);
      doc.text(`Total Employees: ${stats.totalEmployees}`, 14, 42);
      doc.text(`Present Today: ${stats.presentToday}`, 14, 48);
      doc.text(`Absent Today: ${stats.absentToday}`, 14, 54);
      doc.text(`Late Today: ${stats.lateToday}`, 14, 60);
      doc.text(`Average Working Hours: ${stats.averageWorkingHours}h`, 14, 66);
      
      // Prepare table data
      const tableData = attendanceRecords.map(record => [
        `${(record.employee as any)?.first_name || 'N/A'} ${(record.employee as any)?.last_name || 'N/A'}`,
        (record.employee as any)?.email || 'N/A',
        (record.employee as any)?.department_id || 'N/A',
        (record.employee as any)?.position || 'N/A',
        record.check_in_time || 'Not clocked in',
        record.check_out_time || 'Not clocked out',
        calculateWorkingHours(record.check_in_time, record.check_out_time),
        record.status,
        (record as any).approval_status || 'pending',
        record.location_lat && record.location_lng ? `${record.location_lat}, ${record.location_lng}` : 'Not tracked'
      ]);
      
      // Add table
      (doc as any).autoTable({
        head: [['Employee', 'Email', 'Department', 'Position', 'Check In', 'Check Out', 'Working Hours', 'Status', 'Approval', 'Location']],
        body: tableData,
        startY: 80,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 139, 202] },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      });
      
      // Add footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Page ${i} of ${pageCount}`, 14, doc.internal.pageSize.height - 10);
        doc.text(`Generated on ${new Date().toLocaleString()}`, doc.internal.pageSize.width - 60, doc.internal.pageSize.height - 10);
      }
      
      // Save the PDF
      doc.save(`attendance-report-${selectedDate}.pdf`);
      toast.success('Attendance report exported successfully!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export attendance report');
    }
  };

  const exportAllAttendanceToPDF = async () => {
    try {
      // Get all attendance records for the selected date
      const { data: allAttendanceData } = await supabase
        .from('attendance')
        .select(`
          *,
          employee:profiles!attendance_employee_id_fkey(
            first_name, 
            last_name, 
            email,
            department_id, 
            position, 
            avatar_url
          )
        `)
        .eq('date', selectedDate)
        .order('check_in_time', { ascending: false });

      if (!allAttendanceData || allAttendanceData.length === 0) {
        toast.error('No attendance data found for the selected date');
        return;
      }

      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(20);
      doc.text('Complete Employee Attendance Report', 14, 22);
      
      // Add date
      doc.setFontSize(12);
      doc.text(`Date: ${new Date(selectedDate).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}`, 14, 32);
      
      // Add summary stats
      const present = allAttendanceData.filter(record => record.status === 'present').length;
      const absent = (employees?.length || 0) - present;
      const late = allAttendanceData.filter(record => {
        if (!record.check_in_time) return false;
        const checkInTime = new Date(`2000-01-01T${record.check_in_time}`);
        const workStartTime = new Date('2000-01-01T09:00:00');
        return checkInTime > workStartTime;
      }).length;

      doc.setFontSize(10);
      doc.text(`Total Employees: ${employees?.length || 0}`, 14, 42);
      doc.text(`Present Today: ${present}`, 14, 48);
      doc.text(`Absent Today: ${absent}`, 14, 54);
      doc.text(`Late Today: ${late}`, 14, 60);
      
      // Prepare table data
      const tableData = allAttendanceData.map(record => [
        `${(record.employee as any)?.first_name || 'N/A'} ${(record.employee as any)?.last_name || 'N/A'}`,
        (record.employee as any)?.email || 'N/A',
        (record.employee as any)?.department_id || 'N/A',
        (record.employee as any)?.position || 'N/A',
        record.check_in_time || 'Not clocked in',
        record.check_out_time || 'Not clocked out',
        calculateWorkingHours(record.check_in_time, record.check_out_time),
        record.status,
        (record as any).approval_status || 'pending',
        record.location_lat && record.location_lng ? `${record.location_lat}, ${record.location_lng}` : 'Not tracked',
        record.notes || 'No notes'
      ]);
      
      // Add table
      (doc as any).autoTable({
        head: [['Employee', 'Email', 'Department', 'Position', 'Check In', 'Check Out', 'Working Hours', 'Status', 'Approval', 'Location', 'Notes']],
        body: tableData,
        startY: 80,
        styles: { fontSize: 7 },
        headStyles: { fillColor: [66, 139, 202] },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      });
      
      // Add footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Page ${i} of ${pageCount}`, 14, doc.internal.pageSize.height - 10);
        doc.text(`Generated on ${new Date().toLocaleString()}`, doc.internal.pageSize.width - 60, doc.internal.pageSize.height - 10);
      }
      
      // Save the PDF
      doc.save(`complete-attendance-report-${selectedDate}.pdf`);
      toast.success('Complete attendance report exported successfully!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export attendance report');
    }
  };

  const exportAttendanceToXLSX = () => {
    const rows = attendanceRecords.map(record => ({
      employee: `${(record.employee as any)?.first_name} ${(record.employee as any)?.last_name}`,
      email: (record.employee as any)?.email || 'N/A',
      department: (record.employee as any)?.department_id || 'N/A',
      position: (record.employee as any)?.position || 'N/A',
      date: new Date(selectedDate).toLocaleDateString(),
      check_in: record.check_in_time || 'Not clocked in',
      check_out: record.check_out_time || 'Not clocked out',
      working_hours: calculateWorkingHours(record.check_in_time, record.check_out_time),
      status: record.status,
      approval: (record as any).approval_status || 'pending',
      location: record.location_lat && record.location_lng ? `${record.location_lat}, ${record.location_lng}` : 'Not tracked',
      notes: record.notes || ''
    }));
    exportToXlsx(rows, `attendance-${selectedDate}`);
  };

  const exportAllAttendanceToXLSX = async () => {
    const { data: allAttendanceData } = await supabase
      .from('attendance')
      .select(`
        *,
        employee:profiles!attendance_employee_id_fkey(
          first_name, 
          last_name, 
          email,
          department, 
          position, 
          avatar_url
        )
      `)
      .eq('date', selectedDate)
      .order('check_in_time', { ascending: false });

    const rows = (allAttendanceData || []).map((record: any) => ({
      employee: `${(record.employee as any)?.first_name} ${(record.employee as any)?.last_name}`,
      email: (record.employee as any)?.email || 'N/A',
      department: (record.employee as any)?.department_id || 'N/A',
      position: (record.employee as any)?.position || 'N/A',
      date: new Date(selectedDate).toLocaleDateString(),
      check_in: record.check_in_time || 'Not clocked in',
      check_out: record.check_out_time || 'Not clocked out',
      working_hours: calculateWorkingHours(record.check_in_time, record.check_out_time),
      status: record.status,
      approval: (record as any).approval_status || 'pending',
      location: record.location_lat && record.location_lng ? `${record.location_lat}, ${record.location_lng}` : 'Not tracked',
      notes: record.notes || ''
    }));
    exportToXlsx(rows, `attendance-all-${selectedDate}`);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex items-center justify-between">
          <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">HR Dashboard</h1>
        <p className="text-muted-foreground">
          Comprehensive overview of employee management and attendance tracking
        </p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 
              connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 
              'bg-red-500'
            }`}></div>
            <span className={`text-sm font-medium ${
              connectionStatus === 'connected' ? 'text-green-600' : 
              connectionStatus === 'connecting' ? 'text-yellow-600' : 
              'text-red-600'
            }`}>
              {connectionStatus === 'connected' ? 'Live Sync Active' : 
               connectionStatus === 'connecting' ? 'Connecting...' : 
               'Connection Lost'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Stats Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
        <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
                <p className="text-2xl font-bold">{stats.totalEmployees}</p>
                    </div>
              <Users className="h-8 w-8 text-blue-500" />
                  </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Present Today</p>
                <p className="text-2xl font-bold text-green-600">{stats.presentToday}</p>
                  </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Absent Today</p>
                <p className="text-2xl font-bold text-red-600">{stats.absentToday}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
      </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Late Today</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.lateToday}</p>
                  </div>
              <Timer className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs defaultValue="attendance" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="attendance">Attendance Overview</TabsTrigger>
            <TabsTrigger value="employees">Employee Stats</TabsTrigger>
            <TabsTrigger value="recruitment">Recruitment</TabsTrigger>
          </TabsList>

          <TabsContent value="attendance" className="space-y-6">
            {/* Modern Attendance Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Date Selector Card */}
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-blue-700">
                  <CalendarDays className="h-5 w-5" />
                    Select Date
                </CardTitle>
                </CardHeader>
                <CardContent>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full border-2 border-blue-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                  <p className="text-xs text-blue-600 mt-2">
                    {new Date(selectedDate).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                </CardContent>
              </Card>

              {/* Present Employees */}
              <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200 hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600 mb-1">Present Today</p>
                      <p className="text-3xl font-bold text-green-700">{stats.presentToday}</p>
                      <p className="text-xs text-green-600 mt-1">
                        {stats.totalEmployees > 0 ? Math.round((stats.presentToday / stats.totalEmployees) * 100) : 0}% of total
                      </p>
                </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  </div>
                </CardContent>
              </Card>

              {/* Absent Employees */}
              <Card className="bg-gradient-to-br from-red-50 to-rose-100 border-red-200 hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-600 mb-1">Absent Today</p>
                      <p className="text-3xl font-bold text-red-700">{stats.absentToday}</p>
                      <p className="text-xs text-red-600 mt-1">
                        {stats.totalEmployees > 0 ? Math.round((stats.absentToday / stats.totalEmployees) * 100) : 0}% of total
                      </p>
                  </div>
                    <div className="p-3 bg-red-100 rounded-full">
                      <XCircle className="h-8 w-8 text-red-600" />
                </div>
                  </div>
                </CardContent>
              </Card>
                
              {/* Late Employees */}
              <Card className="bg-gradient-to-br from-yellow-50 to-amber-100 border-yellow-200 hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-600 mb-1">Late Today</p>
                      <p className="text-3xl font-bold text-yellow-700">{stats.lateToday}</p>
                      <p className="text-xs text-yellow-600 mt-1">
                        {stats.presentToday > 0 ? Math.round((stats.lateToday / stats.presentToday) * 100) : 0}% of present
                      </p>
                  </div>
                    <div className="p-3 bg-yellow-100 rounded-full">
                      <Timer className="h-8 w-8 text-yellow-600" />
                    </div>
                </div>
              </CardContent>
            </Card>
            </div>

            {/* Attendance Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Attendance Rate Chart */}
              <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-700">
                    <BarChart3 className="h-5 w-5" />
                    Attendance Rate
                </CardTitle>
                  <CardDescription>Overall attendance performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Attendance Rate</span>
                      <span className="text-lg font-bold text-purple-700">
                        {stats.totalEmployees > 0 ? Math.round((stats.presentToday / stats.totalEmployees) * 100) : 0}%
                      </span>
                    </div>
                    <Progress 
                      value={stats.totalEmployees > 0 ? (stats.presentToday / stats.totalEmployees) * 100 : 0} 
                      className="h-3 bg-purple-100"
                    />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-purple-600">Average Working Hours</span>
                      <span className="font-semibold text-purple-700">{stats.averageWorkingHours}h</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="bg-gradient-to-br from-indigo-50 to-blue-100 border-indigo-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-indigo-700">
                    <Activity className="h-5 w-5" />
                    Quick Stats
                  </CardTitle>
                  <CardDescription>Key attendance metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-indigo-600" />
                        <span className="text-sm font-medium">Total Employees</span>
                      </div>
                      <span className="font-bold text-indigo-700">{stats.totalEmployees}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-indigo-600" />
                        <span className="text-sm font-medium">Active Today</span>
                      </div>
                      <span className="font-bold text-indigo-700">{stats.presentToday}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-indigo-600" />
                        <span className="text-sm font-medium">Performance</span>
                      </div>
                      <span className="font-bold text-indigo-700">{stats.averagePerformance}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Live Activity Feed */}
            {recentActivity.length > 0 && (
              <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <Activity className="h-5 w-5" />
                    Live Activity Feed
                  </CardTitle>
                  <CardDescription className="text-green-600">
                    Real-time employee check-in/out notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                        <div className={`w-2 h-2 rounded-full ${
                          activity.type === 'clock_in' ? 'bg-green-500' : 'bg-blue-500'
                        } animate-pulse`}></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">
                            {activity.type === 'clock_in' ? '🟢 Employee Clocked In' : '🔵 Employee Clocked Out'}
                          </p>
                          <p className="text-xs text-gray-600">
                            {new Date(activity.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {activity.type === 'clock_in' ? 'Check In' : 'Check Out'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* New Real-time Attendance List */}
            <Card className="bg-gradient-to-br from-white to-gray-50 border-gray-200">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-gray-800">
                      <Users2 className="h-5 w-5 text-blue-600" />
                      Attendance List - All Employees
                      <div className="flex items-center gap-2 ml-4">
                        <div className={`w-2 h-2 rounded-full ${
                          connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 
                          connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 
                          'bg-red-500'
                        }`}></div>
                        <span className={`text-sm font-medium ${
                          connectionStatus === 'connected' ? 'text-green-600' : 
                          connectionStatus === 'connecting' ? 'text-yellow-600' : 
                          'text-red-600'
                        }`}>
                          {connectionStatus === 'connected' ? 'Live Sync' : 
                           connectionStatus === 'connecting' ? 'Connecting...' : 
                           'Offline'}
                        </span>
                        {isUpdating && (
                          <div className="flex items-center gap-1 ml-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                            <span className="text-sm text-blue-600">Updating...</span>
                          </div>
                        )}
                      </div>
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Real-time attendance tracking for all employees including HR
                    </CardDescription>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>Total Employees: <span className="font-semibold text-gray-700">{employees.length}</span></span>
                      <span>Checked In: <span className="font-semibold text-green-600">{attendanceRecords.filter(r => r.check_in_time).length}</span></span>
                      <span>Active Now: <span className="font-semibold text-blue-600">{attendanceRecords.filter(r => r.check_in_time && !r.check_out_time).length}</span></span>
                      <span>Not Arrived: <span className="font-semibold text-red-600">{employees.length - attendanceRecords.filter(r => r.check_in_time).length}</span></span>
                      <span>Date: <span className="font-semibold text-gray-700">{new Date(selectedDate).toLocaleDateString()}</span></span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={exportAttendanceToXLSX}
                      disabled={attendanceRecords.length === 0}
                      className="border-green-200 text-green-700 hover:bg-green-50"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export to XLSX
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-gray-50">
                    <TableRow>
                        <TableHead className="font-semibold text-gray-700">Employee</TableHead>
                        <TableHead className="font-semibold text-gray-700">Position</TableHead>
                        <TableHead className="font-semibold text-gray-700">Check-in Time</TableHead>
                        <TableHead className="font-semibold text-gray-700">Check-out Time</TableHead>
                        <TableHead className="font-semibold text-gray-700">Working Hours</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                      {employees.length > 0 ? (
                        employees.map((employee, index) => {
                          // Find attendance record for this employee
                          const attendanceRecord = attendanceRecords.find(r => r.employee_id === employee.id);
                          
                          // Debug logging
                          if (index === 0) {
                            console.log('First employee:', employee);
                            console.log('First attendance record:', attendanceRecord);
                            console.log('Total attendance records:', attendanceRecords.length);
                          }
                          
                          return (
                          <TableRow 
                              key={employee.id} 
                            className={`hover:bg-blue-50/50 transition-colors ${
                              index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                            }`}
                          >
                        <TableCell>
                          <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Avatar className="h-10 w-10 border-2 border-gray-200 shadow-sm">
                                    <AvatarImage 
                                        src={employee.avatar_url} 
                                      className="object-cover"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                    <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100 text-gray-700 font-semibold text-sm">
                                        {employee.first_name?.[0]}{employee.last_name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                                    {/* Real-time status indicator */}
                                    {attendanceRecord?.check_in_time && !attendanceRecord?.check_out_time && (
                                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                                    )}
                                    {!attendanceRecord?.check_in_time && (
                                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold text-gray-800 truncate">
                                      {employee.first_name} {employee.last_name}
                              </p>
                                    <p className="text-xs text-gray-400 truncate">
                                      {employee.email || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {employee.position}
                                </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                                <span className={`font-mono text-sm ${
                                    attendanceRecord?.check_in_time ? 
                                      (isLate(attendanceRecord.check_in_time) ? 'text-orange-600 font-semibold' : 'text-green-700') : 
                                      'text-gray-400'
                                }`}>
                                    {attendanceRecord?.check_in_time || 'Not checked in'}
                            </span>
                                  {attendanceRecord?.check_in_time && isLate(attendanceRecord.check_in_time) && (
                                  <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                                    Late
                          </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                                {attendanceRecord?.check_in_time ? (
                                  attendanceRecord?.check_out_time ? (
                              <span className="font-mono text-sm text-gray-700">
                                      {attendanceRecord.check_out_time}
                              </span>
                            ) : (
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-sm text-green-600 font-medium">Active</span>
                            </div>
                            )
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                              <span className="font-semibold text-gray-700">
                                  {attendanceRecord ? (
                                    clockTick && calculateWorkingHoursLive(attendanceRecord)
                                  ) : (
                                    '—'
                                  )}
                              </span>
                        </TableCell>
                          </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            <div className="flex flex-col items-center gap-2">
                              <Users className="h-8 w-8 text-gray-400" />
                              <p className="text-gray-500">No employees found</p>
                              <p className="text-sm text-gray-400">Add employees to see their attendance status</p>
                          </div>
                        </TableCell>
                      </TableRow>
                      )}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>

          </TabsContent>

          <TabsContent value="employees" className="space-y-6">
            {/* Employee Performance Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Employee Performance Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <TrendingUp className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-600">{stats.averagePerformance}%</p>
                    <p className="text-sm text-blue-600">Avg Performance</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Users className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-purple-600">{stats.activeEmployees}</p>
                    <p className="text-sm text-purple-600">Active Employees</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <TrendingDown className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-orange-600">{stats.turnoverRate}%</p>
                    <p className="text-sm text-orange-600">Turnover Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Employee List */}
            <Card>
              <CardHeader>
                <CardTitle>Employee Directory</CardTitle>
                <CardDescription>All active employees in the organization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {employees.map((employee) => (
                    <div key={employee.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={employee.avatar_url} />
                        <AvatarFallback>
                          {employee.first_name?.[0]}{employee.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{employee.first_name} {employee.last_name}</p>
                          <p className="text-sm text-muted-foreground">{employee.position}</p>
                          <p className="text-xs text-muted-foreground">{employee.department_id}</p>
                      </div>
                        <Badge variant="secondary">{employee.role}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recruitment" className="space-y-6">
            {/* Recruitment Pipeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Recruitment Pipeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recruitmentPipeline.map((position) => (
                    <div key={position.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{position.position}</h4>
                        <Badge variant="outline">{position.department}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {position.candidates} candidates
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(position.status)}>
                          {position.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}