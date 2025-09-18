import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  Award,
  Clock,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  Plus,
  Settings,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  DollarSign
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tooltip } from '@/components/ui/tooltip';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: string;
  position: string;
  department: string;
  hire_date: string;
  is_active: boolean;
  avatar_url?: string;
  performance_score?: number;
  attendance_rate?: number;
  last_login?: string;
  salary?: number;
}

export default function EmployeeManagement() {
  const { userProfile } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [salaryRequests, setSalaryRequests] = useState<any[]>([]);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [employees, searchTerm, departmentFilter, statusFilter]);

  useEffect(() => {
    fetchSalaryRequests();
  }, []);

  // Merge salary requests from localStorage (client-side) with backend
  useEffect(() => {
    const savedSalaryRequests = localStorage.getItem('salaryRequests');
    let localSalaryRequests = [];
    if (savedSalaryRequests) {
      localSalaryRequests = JSON.parse(savedSalaryRequests);
    }
    // Only add requests not already in backend (by id)
    setSalaryRequests((prev) => {
      const backendIds = new Set((prev || []).map((r: any) => r.id));
      const merged = [...prev, ...localSalaryRequests.filter((r: any) => !backendIds.has(r.id))];
      return merged;
    });
  }, []);

  // Modern employee detail modal
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const openEmployeeModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowEmployeeModal(true);
  };
  const closeEmployeeModal = () => {
    setShowEmployeeModal(false);
    setSelectedEmployee(null);
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform data to match Employee interface
      const transformedData: Employee[] = (data || []).map((employee: any) => ({
        id: employee.id,
        first_name: employee.first_name,
        last_name: employee.last_name,
        email: employee.email,
        phone: employee.phone,
        role: employee.role,
        position: employee.position || 'Employee',
        department: employee.department || 'General',
        hire_date: employee.hire_date || employee.created_at,
        is_active: employee.is_active,
        avatar_url: employee.avatar_url,
        performance_score: Math.floor(Math.random() * 100) + 60,
        attendance_rate: Math.floor(Math.random() * 20) + 80,
        last_login: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        salary: employee.salary,
      }));

      setEmployees(transformedData);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const filterEmployees = () => {
    let filtered = employees;

    if (searchTerm) {
      filtered = filtered.filter(employee =>
        employee.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.position.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (departmentFilter !== 'all') {
      filtered = filtered.filter(employee => employee.department === departmentFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(employee => 
        statusFilter === 'active' ? employee.is_active : !employee.is_active
      );
    }

    setFilteredEmployees(filtered);
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 80) return 'text-blue-600 bg-blue-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600 bg-green-100';
    if (rate >= 85) return 'text-blue-600 bg-blue-100';
    if (rate >= 75) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const departments = [...new Set(employees.map(emp => emp.department))];
  const activeCount = employees.filter(emp => emp.is_active).length;
  const inactiveCount = employees.filter(emp => !emp.is_active).length;

  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase.from('profiles').update({ is_active: true }).eq('id', id);
      if (error) throw error;
      toast.success('Employee approved!');
      fetchEmployees();
    } catch (error) {
      toast.error('Failed to approve employee');
    }
  };
  const handlePromote = async (id: string) => {
    try {
      // For demo, promote to 'senior' position
      const { error } = await supabase.from('profiles').update({ position: 'Senior Employee' }).eq('id', id);
      if (error) throw error;
      toast.success('Employee promoted!');
      fetchEmployees();
    } catch (error) {
      toast.error('Failed to promote employee');
    }
  };
  const handleIncreaseSalary = async (id: string) => {
    const newSalary = prompt('Enter new salary:');
    if (!newSalary || isNaN(Number(newSalary))) {
      toast.error('Invalid salary');
      return;
    }
    try {
      const { error } = await supabase.from('profiles').update({ salary: Number(newSalary) }).eq('id', id);
      if (error) throw error;
      toast.success('Salary updated!');
      fetchEmployees();
    } catch (error) {
      toast.error('Failed to update salary');
    }
  };

  // Add employee modal logic
  const [showAdd, setShowAdd] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    first_name: '', last_name: '', email: '', phone: '', department: '', position: '', salary: '',
  });
  const handleAddEmployee = async () => {
    if (!newEmployee.first_name || !newEmployee.last_name || !newEmployee.email || !newEmployee.department || !newEmployee.position) {
      toast.error('Please fill in all required fields');
      return;
    }
    try {
      const { error } = await supabase.from('profiles').insert({
        first_name: newEmployee.first_name,
        last_name: newEmployee.last_name,
        email: newEmployee.email,
        phone: newEmployee.phone,
        department: newEmployee.department,
        position: newEmployee.position,
        salary: newEmployee.salary ? Number(newEmployee.salary) : null,
        role: 'employee',
        is_active: true,
        created_at: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success('Employee added!');
      setShowAdd(false);
      setNewEmployee({ first_name: '', last_name: '', email: '', phone: '', department: '', position: '', salary: '' });
      fetchEmployees();
    } catch (error) {
      toast.error('Failed to add employee');
    }
  };

  const fetchSalaryRequests = async () => {
    const { data, error } = await supabase
      .from('requests')
      .select('*, profiles:employee_id(first_name, last_name, email, salary)')
      .eq('type', 'salary')
      .order('created_at', { ascending: false });
    if (!error) setSalaryRequests(data || []);
  };

  const handleApproveRequest = async (request: any) => {
    // Update employee salary
    await supabase.from('profiles').update({ salary: request.amount }).eq('id', request.employee_id);
    // Mark request as approved
    await supabase.from('requests').update({ status: 'approved', approved_at: new Date().toISOString(), approved_by: userProfile?.id }).eq('id', request.id);
    fetchSalaryRequests();
    fetchEmployees();
    toast.success('Salary request approved and employee salary updated!');
  };

  const handleRejectRequest = async () => {
    if (!selectedRequest) return;
    await supabase.from('requests').update({ status: 'rejected', rejection_reason: rejectReason }).eq('id', selectedRequest.id);
    setShowRejectDialog(false);
    setRejectReason('');
    setSelectedRequest(null);
    fetchSalaryRequests();
    toast.success('Salary request rejected.');
  };

  const exportEmployeesToPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(20);
      doc.text('Employee Directory Report', 14, 22);
      
      // Add date
      doc.setFontSize(12);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 32);
      
      // Add summary stats
      doc.setFontSize(10);
      doc.text(`Total Employees: ${employees.length}`, 14, 42);
      doc.text(`Active Employees: ${activeCount}`, 14, 48);
      doc.text(`Inactive Employees: ${inactiveCount}`, 14, 54);
      doc.text(`Departments: ${departments.length}`, 14, 60);
      
      // Prepare table data
      const tableData = filteredEmployees.map(employee => [
        `${employee.first_name} ${employee.last_name}`,
        employee.email,
        employee.phone || 'N/A',
        employee.department,
        employee.position,
        employee.role,
        employee.is_active ? 'Active' : 'Inactive',
        employee.salary ? `₵${employee.salary.toLocaleString()}` : 'Not set',
        new Date(employee.hire_date).toLocaleDateString(),
        `${employee.performance_score}%`,
        `${employee.attendance_rate}%`
      ]);
      
      // Add table
      (doc as any).autoTable({
        head: [['Name', 'Email', 'Phone', 'Department', 'Position', 'Role', 'Status', 'Salary', 'Hire Date', 'Performance', 'Attendance']],
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
      doc.save(`employee-directory-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Employee directory exported successfully!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export employee directory');
    }
  };

  const exportEmployeesToXLSX = async () => {
    const rows = filteredEmployees.map(employee => ({
      name: `${employee.first_name} ${employee.last_name}`,
      email: employee.email,
      phone: employee.phone || 'N/A',
      department: employee.department,
      position: employee.position,
      role: employee.role,
      status: employee.is_active ? 'Active' : 'Inactive',
      salary: employee.salary ?? '',
      hire_date: new Date(employee.hire_date).toLocaleDateString(),
      performance: `${employee.performance_score}%`,
      attendance: `${employee.attendance_rate}%`
    }));

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
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');
      XLSX.writeFile(workbook, `employees-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Employees exported successfully');
    } catch (err) {
      console.error('XLSX export failed, falling back to CSV', err);
      const headers = Object.keys(rows[0] || {});
      const escapeCsv = (val: any) => {
        const s = String(val ?? '');
        if (s.includes(',') || s.includes('"') || s.includes('\n')) {
          return '"' + s.replace(/"/g, '""') + '"';
        }
        return s;
      };
      const csv = [headers.join(',')]
        .concat(rows.map(r => headers.map(h => escapeCsv((r as any)[h])).join(',')))
        .join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `employees-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Employees CSV exported');
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Employee Management
        </h1>
        <p className="text-muted-foreground">
          Comprehensive employee management and oversight system.
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
                <p className="text-2xl font-bold text-foreground">{employees.length}</p>
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
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{activeCount}</p>
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
                <p className="text-sm font-medium text-muted-foreground">Inactive</p>
                <p className="text-2xl font-bold text-gray-600">{inactiveCount}</p>
              </div>
              <div className="p-3 rounded-full bg-gray-100">
                <XCircle className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Departments</p>
                <p className="text-2xl font-bold text-purple-600">{departments.length}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <Building2 className="h-6 w-6 text-purple-600" />
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
                  <Users className="h-5 w-5" />
                  <span className="font-semibold">Employees</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    Grid
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    List
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={exportEmployeesToPDF}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" size="sm" onClick={exportEmployeesToXLSX}>
                  <Download className="h-4 w-4 mr-2" />
                  Export XLSX
                </Button>
                <Button size="sm" onClick={() => setShowAdd(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Employee
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="px-3 py-2 border border-input rounded-md bg-background text-sm"
                >
                  <option value="all">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-input rounded-md bg-background text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Employee List/Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Tabs defaultValue="employees" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="employees">Employees</TabsTrigger>
            <TabsTrigger value="salary-requests">Salary Change Requests</TabsTrigger>
          </TabsList>
          <TabsContent value="employees">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEmployees.map((employee) => (
                  <motion.div
                    key={employee.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="group"
                  >
                    <Card className="hover:shadow-2xl transition-shadow rounded-2xl bg-gradient-to-br from-white via-fuchsia-50 to-purple-100 border-0">
                      <CardHeader className="pb-4 flex flex-row items-center gap-4">
                        <Avatar className="h-16 w-16 shadow-lg border-2 border-purple-200">
                          <AvatarImage src={employee.avatar_url} />
                          <AvatarFallback>
                            {employee.first_name?.[0]}{employee.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-xl font-bold text-purple-700">
                            {employee.first_name} {employee.last_name}
                          </CardTitle>
                          <CardDescription className="text-sm text-muted-foreground mb-1">{employee.position} • {employee.department}</CardDescription>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary">{employee.role}</Badge>
                            <Badge variant="outline">{employee.is_active ? 'Active' : 'Inactive'}</Badge>
                          </div>
                        </div>
                        <Button size="icon" variant="ghost" onClick={() => openEmployeeModal(employee)}>
                          <Eye className="h-5 w-5 text-purple-600" />
                        </Button>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{employee.email}</span>
                        </div>
                        {employee.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{employee.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span>{employee.department}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold text-green-700">{employee.salary ? `₵${employee.salary.toLocaleString()}` : 'Not set'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-yellow-500" />
                          <span>Performance: <span className="font-semibold">{employee.performance_score}%</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-500" />
                          <span>Attendance: <span className="font-semibold">{employee.attendance_rate}%</span></span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
                {/* Employee Detail Modal */}
                {showEmployeeModal && selectedEmployee && (
                  <Dialog open={showEmployeeModal} onOpenChange={closeEmployeeModal}>
                    <DialogContent className="max-w-lg rounded-2xl shadow-2xl border-0 bg-gradient-to-br from-white via-fuchsia-50 to-purple-100 p-8">
                      <DialogTitle className="text-2xl font-bold text-purple-700 mb-2">{selectedEmployee.first_name} {selectedEmployee.last_name}</DialogTitle>
                      <div className="flex flex-col items-center mb-4">
                        <Avatar className="h-20 w-20 shadow-lg border-2 border-purple-200 mb-2">
                          <AvatarImage src={selectedEmployee.avatar_url} />
                          <AvatarFallback>
                            {selectedEmployee.first_name?.[0]}{selectedEmployee.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <Badge variant="secondary">{selectedEmployee.role}</Badge>
                          <Badge variant="outline">{selectedEmployee.is_active ? 'Active' : 'Inactive'}</Badge>
                        </div>
                        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                          <span><Mail className="inline h-4 w-4 mr-1" /> {selectedEmployee.email}</span>
                          {selectedEmployee.phone && <span><Phone className="inline h-4 w-4 mr-1" /> {selectedEmployee.phone}</span>}
                          <span><Building2 className="inline h-4 w-4 mr-1" /> {selectedEmployee.department}</span>
                          <span><DollarSign className="inline h-4 w-4 mr-1" /> <span className="font-semibold text-green-700">{selectedEmployee.salary ? `₵${selectedEmployee.salary.toLocaleString()}` : 'Not set'}</span></span>
                          <span><Award className="inline h-4 w-4 mr-1 text-yellow-500" /> Performance: <span className="font-semibold">{selectedEmployee.performance_score}%</span></span>
                          <span><Clock className="inline h-4 w-4 mr-1 text-blue-500" /> Attendance: <span className="font-semibold">{selectedEmployee.attendance_rate}%</span></span>
                          <span><Calendar className="inline h-4 w-4 mr-1" /> Hired: {new Date(selectedEmployee.hire_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-center mt-4">
                        <Tooltip content="Promote">
                          <Button size="sm" variant="outline" onClick={() => handlePromote(selectedEmployee.id)}>
                            <TrendingUp className="h-4 w-4 text-blue-600" />
                          </Button>
                        </Tooltip>
                        <Tooltip content="Increase Salary">
                          <Button size="sm" variant="outline" onClick={() => handleIncreaseSalary(selectedEmployee.id)}>
                            <DollarSign className="h-4 w-4 text-yellow-600" />
                          </Button>
                        </Tooltip>
                        <Tooltip content="Approve Employee">
                          <Button size="sm" variant="outline" onClick={() => handleApprove(selectedEmployee.id)}>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                        </Tooltip>
                        <Tooltip content="Edit">
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Tooltip>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <ScrollArea className="h-96">
                    <div className="space-y-2 p-4">
                      {filteredEmployees.map((employee) => (
                        <motion.div
                          key={employee.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          <Avatar>
                            <AvatarImage src={employee.avatar_url} />
                            <AvatarFallback>
                              {employee.first_name?.[0]}{employee.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{employee.first_name} {employee.last_name}</h4>
                              <Badge variant={employee.is_active ? 'default' : 'secondary'}>
                                {employee.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{employee.position} • {employee.department}</p>
                            <p className="text-xs text-muted-foreground">{employee.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getPerformanceColor(employee.performance_score || 0)}>
                              {employee.performance_score}% Performance
                            </Badge>
                            <Badge className={getAttendanceColor(employee.attendance_rate || 0)}>
                              {employee.attendance_rate}% Attendance
                            </Badge>
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="ghost">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost">
                                <Mail className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          <TabsContent value="salary-requests">
            <Card>
              <CardHeader>
                <CardTitle>Salary Change Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Current Salary</TableHead>
                      <TableHead>Requested Salary</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salaryRequests.map((req) => (
                      <TableRow key={req.id}>
                        <TableCell>{req.profiles?.first_name} {req.profiles?.last_name}</TableCell>
                        <TableCell>{req.profiles?.email}</TableCell>
                        <TableCell>{req.profiles?.salary ? `₵${req.profiles.salary.toLocaleString()}` : 'Not set'}</TableCell>
                        <TableCell>{req.amount ? `₵${req.amount.toLocaleString()}` : ''}</TableCell>
                        <TableCell>{req.description}</TableCell>
                        <TableCell>{req.status}</TableCell>
                        <TableCell>
                          {req.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleApproveRequest(req)}>Approve</Button>
                              <Button size="sm" variant="destructive" onClick={() => { setSelectedRequest(req); setShowRejectDialog(true); }}>Reject</Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
              <DialogContent>
                <DialogTitle>Reject Salary Request</DialogTitle>
                <Textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Enter rejection reason..." />
                <Button onClick={handleRejectRequest} className="mt-2">Submit</Button>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </motion.div>

      {showAdd && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Employee</h2>
            <div className="space-y-2">
              <Input placeholder="First Name" value={newEmployee.first_name} onChange={e => setNewEmployee({ ...newEmployee, first_name: e.target.value })} />
              <Input placeholder="Last Name" value={newEmployee.last_name} onChange={e => setNewEmployee({ ...newEmployee, last_name: e.target.value })} />
              <Input placeholder="Email" value={newEmployee.email} onChange={e => setNewEmployee({ ...newEmployee, email: e.target.value })} />
              <Input placeholder="Phone" value={newEmployee.phone} onChange={e => setNewEmployee({ ...newEmployee, phone: e.target.value })} />
              <Input placeholder="Department" value={newEmployee.department} onChange={e => setNewEmployee({ ...newEmployee, department: e.target.value })} />
              <Input placeholder="Position" value={newEmployee.position} onChange={e => setNewEmployee({ ...newEmployee, position: e.target.value })} />
              <Input placeholder="Salary" type="number" value={newEmployee.salary} onChange={e => setNewEmployee({ ...newEmployee, salary: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button onClick={handleAddEmployee}>Add</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 