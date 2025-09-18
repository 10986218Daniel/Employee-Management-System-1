import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  FileText, 
  Plus, 
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Search,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  User,
  Building2,
  Award,
  Car,
  Home,
  Plane,
  Medical,
  BookOpen,
  Settings
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Request {
  id: string;
  employee_id: string;
  type: 'leave' | 'expense' | 'equipment' | 'training' | 'travel' | 'other' | 'salary';
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'in_review';
  amount?: number;
  start_date?: string;
  end_date?: string;
  created_at: string;
  approved_at?: string;
  approved_by?: string;
  rejection_reason?: string;
  employee?: {
    first_name: string;
    last_name: string;
    role: string;
    avatar_url?: string;
  };
  approver?: {
    first_name: string;
    last_name: string;
    role: string;
    avatar_url?: string;
  };
}

interface RequestType {
  value: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

const requestTypes: RequestType[] = [
  { 
    value: 'leave', 
    label: 'Leave Request', 
    icon: <Calendar className="h-4 w-4" />, 
    color: 'bg-blue-500',
    description: 'Request time off, vacation, or sick leave'
  },
  { 
    value: 'expense', 
    label: 'Expense Reimbursement', 
    icon: <DollarSign className="h-4 w-4" />, 
    color: 'bg-green-500',
    description: 'Submit expenses for reimbursement'
  },
  { 
    value: 'equipment', 
    label: 'Equipment Request', 
    icon: <Settings className="h-4 w-4" />, 
    color: 'bg-purple-500',
    description: 'Request new equipment or tools'
  },
  { 
    value: 'training', 
    label: 'Training Request', 
    icon: <BookOpen className="h-4 w-4" />, 
    color: 'bg-orange-500',
    description: 'Request training or professional development'
  },
  { 
    value: 'travel', 
    label: 'Travel Request', 
    icon: <Plane className="h-4 w-4" />, 
    color: 'bg-indigo-500',
    description: 'Request business travel or accommodation'
  },
  { 
    value: 'other', 
    label: 'Other Request', 
    icon: <FileText className="h-4 w-4" />, 
    color: 'bg-gray-500',
    description: 'Other miscellaneous requests'
  },
  {
    value: 'salary',
    label: 'Salary Change Request',
    icon: <DollarSign className="h-4 w-4" />,
    color: 'bg-pink-500',
    description: 'Request a salary increase or decrease'
  },
];

export default function Requests() {
  const { user, userProfile } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<Request[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [newRequest, setNewRequest] = useState({
    type: '',
    title: '',
    description: '',
    amount: '',
    start_date: '',
    end_date: '',
    reason: ''
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Load salary requests from localStorage (client-side)
  useEffect(() => {
    fetchRequests();
  }, [user]);

  useEffect(() => {
    filterRequests();
  }, [requests, searchTerm, typeFilter, statusFilter]);

  const fetchRequests = async () => {
    try {
      let query = supabase.from('requests').select(`
        *,
        employee:profiles!requests_employee_id_fkey(first_name, last_name, role, avatar_url),
        approver:profiles!requests_approved_by_fkey(first_name, last_name, role, avatar_url)
      `);
      
      // If not admin or HR, only show user's own requests
      if (userProfile?.role !== 'admin' && userProfile?.role !== 'hr') {
        query = query.eq('employee_id', user?.id);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = requests;

    if (searchTerm) {
      filtered = filtered.filter(request =>
        request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(request => request.type === typeFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === statusFilter);
    }

    setFilteredRequests(filtered);
  };

  const submitRequest = async () => {
    if (!newRequest.type || !newRequest.title || !newRequest.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    try {
      const requestData: any = {
        employee_id: user.id,
        type: newRequest.type,
        title: newRequest.title,
        description: newRequest.description,
        status: 'pending'
      };

      if (newRequest.amount) {
        requestData.amount = parseFloat(newRequest.amount);
      }
      if (newRequest.start_date) {
        requestData.start_date = newRequest.start_date;
      }
      if (newRequest.end_date) {
        requestData.end_date = newRequest.end_date;
      }

      console.log('Submitting request:', requestData);

      const { data, error } = await supabase
        .from('requests')
        .insert([requestData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Request submitted successfully:', data);

      // Refresh the requests list to show the new request
      await fetchRequests();
      setIsCreating(false);
      setNewRequest({
        type: '',
        title: '',
        description: '',
        amount: '',
        start_date: '',
        end_date: '',
        reason: ''
      });
      toast.success('Request submitted successfully');
    } catch (error: any) {
      console.error('Error submitting request:', error);
      toast.error(error?.message || 'Failed to submit request');
    }
  };

  const updateRequestStatus = async (requestId: string, status: string, reason?: string) => {
    try {
      // Find the request to get employee_id and amount
      const req = requests.find(r => r.id === requestId);
      const updateData: any = {
        status,
        approved_at: status === 'approved' ? new Date().toISOString() : null,
        approved_by: status === 'approved' ? user?.id : null,
        rejection_reason: status === 'rejected' ? reason : null
      };

      const { error } = await supabase
        .from('requests')
        .update(updateData)
        .eq('id', requestId);
      if (error) throw error;

      // Notify employee about decision
      if (req?.employee_id) {
        await supabase.from('notifications').insert({
          user_id: req.employee_id,
          title: `Request ${status}`,
          message: `Your request "${req.title}" has been ${status}.`,
          type: 'request',
          action_url: '/dashboard/requests',
        });
      }

      // If approved and salary request, update employee salary
      if (status === 'approved' && req?.type === 'salary' && req.amount && req.employee_id) {
        const { error: salaryError } = await supabase
          .from('profiles')
          .update({ salary: req.amount })
          .eq('id', req.employee_id);
        if (salaryError) throw salaryError;
      }

      setRequests(prev =>
        prev.map(request =>
          request.id === requestId
            ? { ...request, ...updateData }
            : request
        )
      );
      toast.success(`Request ${status} successfully`);
    } catch (error) {
      console.error('Error updating request status:', error);
      toast.error('Failed to update request status');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'in_review': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge variant="default" className="bg-green-500">Approved</Badge>;
      case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
      case 'in_review': return <Badge variant="secondary">In Review</Badge>;
      default: return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getRequestTypeIcon = (type: string) => {
    const requestType = requestTypes.find(t => t.value === type);
    return requestType?.icon || <FileText className="h-4 w-4" />;
  };

  const getRequestTypeColor = (type: string) => {
    const requestType = requestTypes.find(t => t.value === type);
    return requestType?.color || 'bg-gray-500';
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;
  const inReviewCount = requests.filter(r => r.status === 'in_review').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Requests</h1>
          <p className="text-muted-foreground">
            Submit and manage your requests for leave, expenses, equipment, and more
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Submit New Request</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Request Type *</Label>
                  <Select value={newRequest.type} onValueChange={(value) => setNewRequest(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select request type" />
                    </SelectTrigger>
                    <SelectContent>
                      {requestTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <div className={`p-1 rounded ${type.color}`}>
                              {type.icon}
                            </div>
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-xs text-muted-foreground">{type.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={newRequest.title}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Request title..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={newRequest.description}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Detailed description of your request..."
                    rows={4}
                  />
                </div>
                {newRequest.type === 'salary' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount (if applicable)</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={newRequest.amount}
                        onChange={(e) => setNewRequest(prev => ({ ...prev, amount: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reason">Reason for Salary Change</Label>
                      <Textarea
                        id="reason"
                        value={newRequest.reason}
                        onChange={(e) => setNewRequest(prev => ({ ...prev, reason: e.target.value }))}
                        placeholder="Explain the reason for your salary change request..."
                        rows={3}
                      />
                    </div>
                  </>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date (if applicable)</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={newRequest.start_date}
                      onChange={(e) => setNewRequest(prev => ({ ...prev, start_date: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date (if applicable)</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={newRequest.end_date}
                      onChange={(e) => setNewRequest(prev => ({ ...prev, end_date: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
                <Button onClick={submitRequest}>
                  Submit Request
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={fetchRequests}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
            <p className="text-xs text-muted-foreground">
              Successfully approved
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
            <p className="text-xs text-muted-foreground">
              Not approved
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Review</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{inReviewCount}</div>
            <p className="text-xs text-muted-foreground">
              Under review
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="flex-1">
          <Input
            placeholder="Search requests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {requestTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_review">In Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Requests List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        {filteredRequests.length === 0 ? (
          <Card className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No requests found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by submitting your first request'
              }
            </p>
            {!searchTerm && typeFilter === 'all' && statusFilter === 'all' && (
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Submit First Request
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group"
              >
                <Card className="hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`p-2 rounded-lg ${getRequestTypeColor(request.type)}`}>
                          {getRequestTypeIcon(request.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{request.title}</h3>
                            {getStatusBadge(request.status)}
                          </div>
                          <p className="text-muted-foreground mb-3 line-clamp-2">
                            {request.description}
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            {request.amount && (
                              <div>
                                <span className="text-muted-foreground">Amount:</span>
                                <p className="font-medium">₵{request.amount.toLocaleString()}</p>
                              </div>
                            )}
                            {request.start_date && (
                              <div>
                                <span className="text-muted-foreground">Start Date:</span>
                                <p className="font-medium">{new Date(request.start_date).toLocaleDateString()}</p>
                              </div>
                            )}
                            {request.end_date && (
                              <div>
                                <span className="text-muted-foreground">End Date:</span>
                                <p className="font-medium">{new Date(request.end_date).toLocaleDateString()}</p>
                              </div>
                            )}
                            <div>
                              <span className="text-muted-foreground">Submitted:</span>
                              <p className="font-medium">{new Date(request.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {(userProfile?.role === 'admin' || userProfile?.role === 'hr') && request.status === 'pending' && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => updateRequestStatus(request.id, 'approved')}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => updateRequestStatus(request.id, 'rejected')}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    {request.status === 'rejected' && request.rejection_reason && (
                      <div className="mt-2 text-sm text-red-600">Reason: {request.rejection_reason}</div>
                    )}
                    {request.approver && (
                      <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={request.approver.avatar_url} />
                          <AvatarFallback>
                            {request.approver.first_name[0]}{request.approver.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">
                          {request.status === 'approved' ? (
                            <>Approved by {request.approver.first_name} {request.approver.last_name} on {request.approved_at ? new Date(request.approved_at).toLocaleDateString() : ''}</>
                          ) : (
                            <>Reviewed by {request.approver.first_name} {request.approver.last_name}</>
                          )}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}