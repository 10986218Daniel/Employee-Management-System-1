import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MessageSquare, 
  Send, 
  Plus,
  Search,
  Clock,
  CheckCircle2,
  User,
  Mail,
  MailOpen,
  Reply,
  Forward,
  Trash2,
  Star,
  StarOff,
  Filter,
  RefreshCw,
  MoreHorizontal,
  Paperclip,
  Smile,
  Phone,
  Video
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string;
  content: string;
  read: boolean;
  created_at: string;
  sender?: {
    first_name: string;
    last_name: string;
    role: string;
    avatar_url?: string;
  };
  recipient?: {
    first_name: string;
    last_name: string;
    role: string;
    avatar_url?: string;
  };
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  email: string;
  avatar_url?: string;
}

export default function Messages() {
  const { user, userProfile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [newMessage, setNewMessage] = useState({
    recipient_id: '',
    subject: '',
    content: ''
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'sent' | 'received'>('all');
  const [selectedTab, setSelectedTab] = useState<'inbox' | 'sent' | 'drafts'>('inbox');

  useEffect(() => {
    if (user) {
      fetchMessages();
      fetchProfiles();
      // Set up real-time subscription for new messages
      const channel = supabase
        .channel('messages-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `recipient_id=eq.${user.id}`
          },
          (payload) => {
            setMessages(prev => [payload.new as Message, ...prev]);
            toast.success('New message received!');
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(first_name, last_name, role, avatar_url),
          recipient:profiles!messages_recipient_id_fkey(first_name, last_name, role, avatar_url)
        `)
        .or(`sender_id.eq.${user?.id},recipient_id.eq.${user?.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role, email, avatar_url')
        .neq('id', user?.id);

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.recipient_id || !newMessage.subject || !newMessage.content) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user?.id,
          recipient_id: newMessage.recipient_id,
          subject: newMessage.subject,
          content: newMessage.content
        });

      if (error) throw error;

      toast.success('Message sent successfully');
      setNewMessage({ recipient_id: '', subject: '', content: '' });
      setIsComposing(false);
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const prepareReply = () => {
    if (!selectedMessage || !user) return;
    const replyRecipientId = selectedMessage.sender_id === user.id 
      ? selectedMessage.recipient_id 
      : selectedMessage.sender_id;
    const replySubject = selectedMessage.subject.startsWith('Re:') 
      ? selectedMessage.subject 
      : `Re: ${selectedMessage.subject}`;
    const quoted = `\n\n--- On ${new Date(selectedMessage.created_at).toLocaleString()} ---\n${selectedMessage.content}`;
    setNewMessage({ recipient_id: replyRecipientId, subject: replySubject, content: quoted });
    setIsComposing(true);
  };

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', messageId)
        .eq('recipient_id', user?.id);

      if (error) throw error;
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, read: true } : msg
        )
      );
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', user?.id);

      if (error) throw error;
      
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      toast.success('Message deleted successfully');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (message.sender?.first_name + ' ' + message.sender?.last_name).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (message.recipient?.first_name + ' ' + message.recipient?.last_name).toLowerCase().includes(searchTerm.toLowerCase());

    if (filter === 'unread') {
      return matchesSearch && !message.read && message.recipient_id === user?.id;
    } else if (filter === 'sent') {
      return matchesSearch && message.sender_id === user?.id;
    } else if (filter === 'received') {
      return matchesSearch && message.recipient_id === user?.id;
    }
    
    return matchesSearch;
  });

  const getRecipientOptions = () => {
    if (userProfile?.role === 'admin') {
      return profiles; // Admin can message anyone
    } else if (userProfile?.role === 'hr') {
      return profiles.filter(p => p.role === 'admin' || p.role === 'employee');
    } else {
      return profiles.filter(p => p.role === 'admin' || p.role === 'hr');
    }
  };

  const unreadCount = messages.filter(msg => !msg.read && msg.recipient_id === user?.id).length;
  const sentCount = messages.filter(msg => msg.sender_id === user?.id).length;
  const receivedCount = messages.filter(msg => msg.recipient_id === user?.id).length;

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
          <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
          <p className="text-muted-foreground">
            Communicate with team members and stay connected
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isComposing} onOpenChange={setIsComposing}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Message
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Compose New Message</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="recipient">To *</Label>
                  <Select value={newMessage.recipient_id} onValueChange={(value) => setNewMessage(prev => ({ ...prev, recipient_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipient" />
                    </SelectTrigger>
                    <SelectContent>
                      {getRecipientOptions().map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={profile.avatar_url} />
                              <AvatarFallback>
                                {profile.first_name[0]}{profile.last_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span>{profile.first_name} {profile.last_name}</span>
                            <Badge variant="outline" className="text-xs capitalize">{profile.role}</Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    value={newMessage.subject}
                    onChange={(e) => setNewMessage(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Message subject..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Message *</Label>
                  <Textarea
                    id="content"
                    value={newMessage.content}
                    onChange={(e) => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Type your message..."
                    rows={6}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsComposing(false)}>
                  Cancel
                </Button>
                <Button onClick={sendMessage} className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Send Message
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={fetchMessages}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
            <Mail className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{unreadCount}</div>
            <p className="text-xs text-muted-foreground">
              Messages requiring attention
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent Messages</CardTitle>
            <Send className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{sentCount}</div>
            <p className="text-xs text-muted-foreground">
              Messages you've sent
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Received Messages</CardTitle>
            <MailOpen className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{receivedCount}</div>
            <p className="text-xs text-muted-foreground">
              Messages you've received
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex border rounded-lg">
            <button
              onClick={() => setSelectedTab('inbox')}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg transition-colors ${
                selectedTab === 'inbox' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-background hover:bg-muted'
              }`}
            >
              Inbox {unreadCount > 0 && <Badge variant="secondary" className="ml-2">{unreadCount}</Badge>}
            </button>
            <button
              onClick={() => setSelectedTab('sent')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                selectedTab === 'sent' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-background hover:bg-muted'
              }`}
            >
              Sent
            </button>
            <button
              onClick={() => setSelectedTab('drafts')}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg transition-colors ${
                selectedTab === 'drafts' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-background hover:bg-muted'
              }`}
            >
              Drafts
            </button>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={filter} onValueChange={(value) => setFilter(value as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter messages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Messages</SelectItem>
                <SelectItem value="unread">Unread Only</SelectItem>
                <SelectItem value="sent">Sent Messages</SelectItem>
                <SelectItem value="received">Received Messages</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </motion.div>

      {/* Messages List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-2"
      >
        {filteredMessages.length === 0 ? (
          <Card className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No messages found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || filter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Start a conversation by sending a message'
              }
            </p>
            {!searchTerm && filter === 'all' && (
              <Button onClick={() => setIsComposing(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Send First Message
              </Button>
            )}
          </Card>
        ) : (
          <ScrollArea className="h-[600px]">
            <div className="space-y-2">
              {filteredMessages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="group"
                >
                  <Card className={`hover:shadow-lg transition-all duration-200 cursor-pointer ${
                    !message.read && message.recipient_id === user?.id ? 'border-blue-200 bg-blue-50/50 dark:bg-blue-950/20' : ''
                  }`} onClick={() => {
                    setSelectedMessage(message);
                    if (!message.read && message.recipient_id === user?.id) {
                      markAsRead(message.id);
                    }
                  }}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={message.sender?.avatar_url || message.recipient?.avatar_url} />
                          <AvatarFallback>
                            {message.sender_id === user?.id 
                              ? message.recipient?.first_name?.[0] + message.recipient?.last_name?.[0]
                              : message.sender?.first_name?.[0] + message.sender?.last_name?.[0]
                            }
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">
                                {message.sender_id === user?.id 
                                  ? `To: ${message.recipient?.first_name} ${message.recipient?.last_name}`
                                  : `${message.sender?.first_name} ${message.sender?.last_name}`
                                }
                              </p>
                              {!message.read && message.recipient_id === user?.id && (
                                <Badge variant="default" className="text-xs">New</Badge>
                              )}
                              <Badge variant="outline" className="text-xs capitalize">
                                {message.sender_id === user?.id 
                                  ? message.recipient?.role 
                                  : message.sender?.role
                                }
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="sm">
                                <Reply className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Forward className="h-4 w-4" />
                              </Button>
                              {message.sender_id === user?.id && (
                                <Button variant="ghost" size="sm" onClick={(e) => {
                                  e.stopPropagation();
                                  deleteMessage(message.id);
                                }}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                          <p className="font-semibold text-sm mb-1">{message.subject}</p>
                          <p className="text-sm text-muted-foreground line-clamp-2">{message.content}</p>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {new Date(message.created_at).toLocaleDateString()} at {new Date(message.created_at).toLocaleTimeString()}
                            </div>
                            {message.read && message.recipient_id === user?.id && (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        )}
      </motion.div>

      {/* Message Detail Dialog */}
      {selectedMessage && (
        <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{selectedMessage.subject}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedMessage.sender?.avatar_url || selectedMessage.recipient?.avatar_url} />
                  <AvatarFallback>
                    {selectedMessage.sender_id === user?.id 
                      ? selectedMessage.recipient?.first_name?.[0] + selectedMessage.recipient?.last_name?.[0]
                      : selectedMessage.sender?.first_name?.[0] + selectedMessage.sender?.last_name?.[0]
                    }
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {selectedMessage.sender_id === user?.id 
                      ? `To: ${selectedMessage.recipient?.first_name} ${selectedMessage.recipient?.last_name}`
                      : `From: ${selectedMessage.sender?.first_name} ${selectedMessage.sender?.last_name}`
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedMessage.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedMessage(null)}>
                  Close
                </Button>
                <Button onClick={prepareReply}>
                  <Reply className="h-4 w-4 mr-2" />
                  Reply
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}