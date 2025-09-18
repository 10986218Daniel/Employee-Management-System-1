import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Megaphone, 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Users,
  Building2,
  Target,
  Eye,
  Edit,
  Trash2,
  Pin,
  Star,
  MessageSquare,
  Share2,
  Bell,
  BellRing,
  FileText,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Announcement {
  id: string;
  author_id: string;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  target_roles?: string[];
  target_departments?: string[];
  published: boolean;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  author?: {
    first_name: string;
    last_name: string;
    role: string;
    avatar_url?: string;
  };
}

interface Department {
  id: string;
  name: string;
  description?: string;
}

export default function Announcements() {
  const { user, userProfile } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    priority: 'normal' as const,
    target_roles: [] as string[],
    target_departments: [] as string[],
    expires_at: '',
    published: false
  });

  // Mock data for demonstration
  const mockAnnouncements: Announcement[] = [
    {
      id: '1',
      author_id: '1',
      title: 'Company Holiday Schedule 2024',
      content: 'Please review the updated holiday schedule for 2024. All employees will have 15 paid holidays including national holidays and company-specific days off.',
      priority: 'high',
      target_roles: ['employee', 'hr', 'admin'],
      target_departments: [],
      published: true,
      expires_at: '2024-12-31',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
      author: {
        first_name: 'Sarah',
        last_name: 'Johnson',
        role: 'hr',
        avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
      }
    },
    {
      id: '2',
      author_id: '2',
      title: 'New Office Location Opening',
      content: 'We are excited to announce the opening of our new office location in Accra Central. The new office will feature modern amenities and collaborative workspaces.',
      priority: 'normal',
      target_roles: ['employee', 'hr', 'admin'],
      target_departments: [],
      published: true,
      expires_at: '2024-06-30',
      created_at: '2024-01-10T14:30:00Z',
      updated_at: '2024-01-10T14:30:00Z',
      author: {
        first_name: 'Michael',
        last_name: 'Chen',
        role: 'admin',
        avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
      }
    },
    {
      id: '3',
      author_id: '3',
      title: 'IT Maintenance Scheduled',
      content: 'Scheduled maintenance will occur this Saturday from 2:00 AM to 6:00 AM. Some systems may be temporarily unavailable during this time.',
      priority: 'urgent',
      target_roles: ['employee', 'hr', 'admin'],
      target_departments: ['it'],
      published: true,
      expires_at: '2024-01-20',
      created_at: '2024-01-08T09:15:00Z',
      updated_at: '2024-01-08T09:15:00Z',
      author: {
        first_name: 'David',
        last_name: 'Wilson',
        role: 'admin',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
      }
    }
  ];

  const mockDepartments: Department[] = [
    { id: '1', name: 'IT Department', description: 'Information Technology' },
    { id: '2', name: 'HR Department', description: 'Human Resources' },
    { id: '3', name: 'Sales Department', description: 'Sales and Marketing' },
    { id: '4', name: 'Finance Department', description: 'Finance and Accounting' },
    { id: '5', name: 'Operations Department', description: 'Operations and Logistics' }
  ];

  useEffect(() => {
    if (user) {
      fetchAnnouncements();
      setAnnouncements(mockAnnouncements);
      setDepartments(mockDepartments);
    }
  }, [user]);

  useEffect(() => {
    filterAnnouncements();
  }, [announcements, searchTerm, priorityFilter, statusFilter]);

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          *,
          author:profiles!announcements_author_id_fkey(first_name, last_name, role, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const filterAnnouncements = () => {
    let filtered = announcements;

    if (searchTerm) {
      filtered = filtered.filter(announcement =>
        announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        announcement.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(announcement => announcement.priority === priorityFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(announcement => 
        statusFilter === 'published' ? announcement.published : !announcement.published
      );
    }

    setFilteredAnnouncements(filtered);
  };

  const createAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.content) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const announcementData: any = {
        author_id: user?.id,
        title: newAnnouncement.title,
        content: newAnnouncement.content,
        priority: newAnnouncement.priority,
        target_roles: newAnnouncement.target_roles.length > 0 ? newAnnouncement.target_roles : null,
        target_departments: newAnnouncement.target_departments.length > 0 ? newAnnouncement.target_departments : null,
        published: newAnnouncement.published,
        expires_at: newAnnouncement.expires_at || null
      };

      const { data, error } = await supabase
        .from('announcements')
        .insert([announcementData])
        .select()
        .single();

      if (error) throw error;

      setAnnouncements(prev => [data, ...prev]);
      setIsCreating(false);
      setNewAnnouncement({
        title: '',
        content: '',
        priority: 'normal',
        target_roles: [],
        target_departments: [],
        expires_at: '',
        published: false
      });
      toast.success('Announcement created successfully');
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast.error('Failed to create announcement');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'normal': return 'bg-blue-500';
      case 'low': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Urgent';
      case 'high': return 'High';
      case 'normal': return 'Normal';
      case 'low': return 'Low';
      default: return 'Unknown';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <BellRing className="h-4 w-4" />;
      case 'normal': return <Bell className="h-4 w-4" />;
      case 'low': return <MessageSquare className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const totalAnnouncements = announcements.length;
  const publishedAnnouncements = announcements.filter(a => a.published).length;
  const draftAnnouncements = announcements.filter(a => !a.published).length;
  const urgentAnnouncements = announcements.filter(a => a.priority === 'urgent').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
          <p className="text-muted-foreground">
            Create and manage company-wide announcements and communications
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle>Create New Announcement</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Announcement title..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Content *</Label>
                  <Textarea
                    id="content"
                    value={newAnnouncement.content}
                    onChange={(e) => setNewAnnouncement(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Announcement content..."
                    rows={6}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={newAnnouncement.priority} onValueChange={(value) => setNewAnnouncement(prev => ({ ...prev, priority: value as any }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expires_at">Expires At</Label>
                    <Input
                      id="expires_at"
                      type="date"
                      value={newAnnouncement.expires_at}
                      onChange={(e) => setNewAnnouncement(prev => ({ ...prev, expires_at: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Target Roles</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {['employee', 'hr', 'admin'].map((role) => (
                      <div key={role} className="flex items-center space-x-2">
                        <Checkbox
                          id={role}
                          checked={newAnnouncement.target_roles.includes(role)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setNewAnnouncement(prev => ({
                                ...prev,
                                target_roles: [...prev.target_roles, role]
                              }));
                            } else {
                              setNewAnnouncement(prev => ({
                                ...prev,
                                target_roles: prev.target_roles.filter(r => r !== role)
                              }));
                            }
                          }}
                        />
                        <Label htmlFor={role} className="text-sm capitalize">{role}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Target Departments</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {departments.map((dept) => (
                      <div key={dept.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={dept.id}
                          checked={newAnnouncement.target_departments.includes(dept.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setNewAnnouncement(prev => ({
                                ...prev,
                                target_departments: [...prev.target_departments, dept.id]
                              }));
                            } else {
                              setNewAnnouncement(prev => ({
                                ...prev,
                                target_departments: prev.target_departments.filter(d => d !== dept.id)
                              }));
                            }
                          }}
                        />
                        <Label htmlFor={dept.id} className="text-sm">{dept.name}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="published"
                    checked={newAnnouncement.published}
                    onCheckedChange={(checked) => setNewAnnouncement(prev => ({ ...prev, published: checked as boolean }))}
                  />
                  <Label htmlFor="published">Publish immediately</Label>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
                <Button onClick={createAnnouncement}>
                  Create Announcement
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={fetchAnnouncements}>
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
            <CardTitle className="text-sm font-medium">Total Announcements</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAnnouncements}</div>
            <p className="text-xs text-muted-foreground">
              All time announcements
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{publishedAnnouncements}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <FileText className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{draftAnnouncements}</div>
            <p className="text-xs text-muted-foreground">
              Pending publication
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{urgentAnnouncements}</div>
            <p className="text-xs text-muted-foreground">
              High priority
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
            placeholder="Search announcements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="flex gap-2">
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Announcements List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        {filteredAnnouncements.map((announcement) => (
          <motion.div
            key={announcement.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group"
          >
            <Card className={`hover:shadow-lg transition-all duration-200 ${
              announcement.priority === 'urgent' ? 'border-red-200 bg-red-50/50 dark:bg-red-950/20' :
              announcement.priority === 'high' ? 'border-orange-200 bg-orange-50/50 dark:bg-orange-950/20' :
              'border-border'
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`p-1 rounded-full ${getPriorityColor(announcement.priority)}`}>
                        {getPriorityIcon(announcement.priority)}
                      </div>
                      <Badge variant={announcement.priority === 'urgent' ? 'destructive' : 'secondary'}>
                        {getPriorityLabel(announcement.priority)}
                      </Badge>
                      {!announcement.published && (
                        <Badge variant="outline">Draft</Badge>
                      )}
                      {isExpired(announcement.expires_at) && (
                        <Badge variant="secondary">Expired</Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg">{announcement.title}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-2">
                      {announcement.content}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    {announcement.author && (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={announcement.author.avatar_url} />
                          <AvatarFallback>
                            {announcement.author.first_name[0]}{announcement.author.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span>
                          {announcement.author.first_name} {announcement.author.last_name}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(announcement.created_at).toLocaleDateString()}
                    </div>
                    {announcement.expires_at && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Expires: {new Date(announcement.expires_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {announcement.target_roles && announcement.target_roles.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {announcement.target_roles.length} role{announcement.target_roles.length > 1 ? 's' : ''}
                      </Badge>
                    )}
                    {announcement.target_departments && announcement.target_departments.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {announcement.target_departments.length} dept{announcement.target_departments.length > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {filteredAnnouncements.length === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No announcements found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || priorityFilter !== 'all' || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Get started by creating your first announcement'
            }
          </p>
          {!searchTerm && priorityFilter === 'all' && statusFilter === 'all' && (
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Announcement
            </Button>
          )}
        </motion.div>
      )}
    </div>
  );
} 