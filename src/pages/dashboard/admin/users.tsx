import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Shield,
  Lock,
  Unlock,
  Key,
  Database,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  Globe,
  UserCheck,
  UserX,
  UserCog
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface User {
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
  last_login?: string;
  login_count?: number;
  created_at: string;
  permissions?: string[];
  salary?: number;
}

export default function UserManagement() {
  const { userProfile } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const generateUserId = () => 'USR' + Math.floor(100000 + Math.random() * 900000);
  const [isAdding, setIsAdding] = useState(false);
  const [newUser, setNewUser] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    role: 'employee',
    user_id: generateUserId(),
    salary: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform data to match User interface
      const transformedData: User[] = (data || []).map((user: any) => ({
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        position: user.position || 'Employee',
        department: user.department || 'General',
        hire_date: user.hire_date || user.created_at,
        is_active: user.is_active,
        avatar_url: user.avatar_url,
        last_login: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        login_count: Math.floor(Math.random() * 100) + 1,
        created_at: user.created_at,
        permissions: getPermissionsForRole(user.role),
        salary: user.salary,
      }));

      setUsers(transformedData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const getPermissionsForRole = (role: string) => {
    switch (role) {
      case 'admin':
        return ['all'];
      case 'hr':
        return ['employee_management', 'reports', 'attendance', 'requests'];
      case 'employee':
        return ['profile', 'attendance', 'requests'];
      default:
        return ['profile'];
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.position.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => 
        statusFilter === 'active' ? user.is_active : !user.is_active
      );
    }

    setFilteredUsers(filtered);
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'hr': return 'bg-blue-100 text-blue-800';
      case 'employee': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: boolean) => {
    return status ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  const roles = [...new Set(users.map(user => user.role))];
  const activeCount = users.filter(user => user.is_active).length;
  const inactiveCount = users.filter(user => !user.is_active).length;
  const adminCount = users.filter(user => user.role === 'admin').length;
  const hrCount = users.filter(user => user.role === 'hr').length;
  const departments = [...new Set(users.map(user => user.department))];
  const departmentSummary = departments.map(dept => ({
    name: dept,
    count: users.filter(user => user.department === dept).length
  }));

  const handleAddUser = async () => {
    if (!newUser.first_name || !newUser.last_name || !newUser.email || !newUser.department || !newUser.position) {
      toast.error('Please fill in all required fields');
      return;
    }
    try {
      const { error } = await supabase.from('profiles').insert({
        id: newUser.user_id,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        email: newUser.email,
        phone: newUser.phone,
        department: newUser.department,
        position: newUser.position,
        role: newUser.role,
        salary: newUser.salary,
        is_active: true,
        created_at: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success('User added successfully');
      setIsAdding(false);
      setNewUser({
        first_name: '', last_name: '', email: '', phone: '', department: '', position: '', role: 'employee', user_id: generateUserId(), salary: ''
      });
      fetchUsers();
    } catch (error) {
      toast.error('Failed to add user');
    }
  };
  const handleDeleteUser = async (userId: string) => {
    if (confirm('Are you sure you want to deactivate this user?')) {
      try {
        const { error } = await supabase.from('profiles').update({ is_active: false }).eq('id', userId);
        if (error) throw error;
        toast.success('User deactivated successfully');
        fetchUsers();
      } catch (error) {
        toast.error('Failed to deactivate user');
      }
    }
  };

  const exportUsersToCSV = () => {
    try {
      if (!filteredUsers || filteredUsers.length === 0) {
        toast.error('No users to export');
        return;
      }

      const safeIso = (value: any) => {
        if (!value) return '';
        const d = new Date(value);
        return isNaN(d.getTime()) ? String(value) : d.toISOString();
      };

      const rows = filteredUsers.map(u => ({
        id: u.id,
        first_name: u.first_name,
        last_name: u.last_name,
        email: u.email,
        phone: u.phone || '',
        role: u.role,
        position: u.position,
        department: u.department,
        is_active: u.is_active ? 'Active' : 'Inactive',
        salary: (u.salary != null && !isNaN(Number(u.salary))) ? String(u.salary) : '',
        hire_date: safeIso(u.hire_date),
        created_at: safeIso(u.created_at)
      }));

      const headers = Object.keys(rows[0] || {
        id: '', first_name: '', last_name: '', email: '', phone: '', role: '', position: '', department: '', is_active: '', salary: '', hire_date: '', created_at: ''
      });

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
      link.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Users exported successfully');
    } catch (err) {
      console.error('Export failed', err);
      toast.error('Failed to export users');
    }
  };

  const exportUsersToXLSX = async () => {
    try {
      if (!filteredUsers || filteredUsers.length === 0) {
        toast.error('No users to export');
        return;
      }
      const rows = filteredUsers.map(u => ({
        id: u.id,
        first_name: u.first_name,
        last_name: u.last_name,
        email: u.email,
        phone: u.phone || '',
        role: u.role,
        position: u.position,
        department: u.department,
        status: u.is_active ? 'Active' : 'Inactive',
        salary: u.salary ?? '',
        hire_date: u.hire_date,
        created_at: u.created_at
      }));

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
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
      XLSX.writeFile(workbook, `users-export-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Users exported successfully');
    } catch (err) {
      console.error('XLSX export failed', err);
      toast.error('Failed to export XLSX');
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
          User Management
        </h1>
        <p className="text-muted-foreground">
          Complete system user management and administrative controls.
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
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold text-foreground">{users.length}</p>
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
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
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
                <p className="text-sm font-medium text-muted-foreground">Admins</p>
                <p className="text-2xl font-bold text-red-600">{adminCount}</p>
              </div>
              <div className="p-3 rounded-full bg-red-100">
                <Shield className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">HR Staff</p>
                <p className="text-2xl font-bold text-blue-600">{hrCount}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <UserCheck className="h-6 w-6 text-blue-600" />
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
                  <span className="font-semibold">Users</span>
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
                <Button variant="outline" size="sm" onClick={exportUsersToCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button variant="outline" size="sm" onClick={exportUsersToXLSX}>
                  <Download className="h-4 w-4 mr-2" />
                  Export XLSX
                </Button>
                <Button size="sm" asChild>
                  <DialogTrigger onClick={() => setIsAdding(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add User
                  </DialogTrigger>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-2 border border-input rounded-md bg-background text-sm"
                >
                  <option value="all">All Roles</option>
                  {roles.map(role => (
                    <option key={role} value={role}>{role}</option>
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

      {/* User List/Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group"
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback>
                          {user.first_name?.[0]}{user.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {user.first_name} {user.last_name}
                        </CardTitle>
                        <CardDescription>{user.position}</CardDescription>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteUser(user.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{user.email}</span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{user.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{user.department}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge className={getRoleColor(user.role)}>
                        {user.role}
                      </Badge>
                      <Badge className={getStatusColor(user.is_active)}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleUserStatus(user.id, user.is_active)}
                      >
                        {user.is_active ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                        {user.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                    {user.salary && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Salary: ₵{user.salary.toLocaleString()}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-96">
                <div className="space-y-2 p-4">
                  {filteredUsers.map((user) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <Avatar>
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback>
                          {user.first_name?.[0]}{user.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{user.first_name} {user.last_name}</h4>
                          <Badge className={getRoleColor(user.role)}>
                            {user.role}
                          </Badge>
                          <Badge className={getStatusColor(user.is_active)}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{user.position} • {user.department}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                        {user.salary && (
                          <p className="text-xs text-muted-foreground">Salary: ₵{user.salary.toLocaleString()}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Last Login</p>
                          <p className="text-sm font-medium">
                            {new Date(user.last_login || '').toLocaleDateString()}
                          </p>
                        </div>
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
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleUserStatus(user.id, user.is_active)}
                          >
                            {user.is_active ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
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
      </motion.div>
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Departments Overview</h2>
        <div className="flex flex-wrap gap-4">
          {departmentSummary.map(dept => (
            <div key={dept.name} className="p-4 bg-muted rounded-lg shadow-sm cursor-pointer hover:bg-primary/10" onClick={() => setSearchTerm(dept.name)}>
              <div className="font-semibold">{dept.name}</div>
              <div className="text-2xl font-bold">{dept.count}</div>
              <div className="text-xs text-muted-foreground">Users</div>
            </div>
          ))}
        </div>
      </div>
      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input placeholder="First Name" value={newUser.first_name} onChange={e => setNewUser({ ...newUser, first_name: e.target.value })} />
            <Input placeholder="Last Name" value={newUser.last_name} onChange={e => setNewUser({ ...newUser, last_name: e.target.value })} />
            <Input placeholder="Email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
            <Input placeholder="Phone" value={newUser.phone} onChange={e => setNewUser({ ...newUser, phone: e.target.value })} />
            <Input placeholder="Department" value={newUser.department} onChange={e => setNewUser({ ...newUser, department: e.target.value })} />
            <Input placeholder="Position" value={newUser.position} onChange={e => setNewUser({ ...newUser, position: e.target.value })} />
            <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} className="px-3 py-2 border border-input rounded-md bg-background text-sm">
              <option value="employee">Employee</option>
              <option value="hr">HR</option>
            </select>
            <Input
              placeholder="Salary"
              type="number"
              value={newUser.salary || ''}
              onChange={e => setNewUser({ ...newUser, salary: e.target.value })}
            />
            <div className="text-xs text-muted-foreground">User ID: <span className="font-mono">{newUser.user_id}</span></div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
            <Button onClick={handleAddUser}>Add User</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 