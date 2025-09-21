'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AuthGuard } from '@/components/auth-guard';
import { db } from '@/lib/db';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, UserPlus, Edit, Trash2, Shield, User, Users } from 'lucide-react';

export default function AdminUsersPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    status: 'active' | 'inactive' | 'pending';
    createdAt: string;
    lastLogin?: string;
  }>>([]);
  const [researchers, setResearchers] = useState<Array<{
    id: string;
    name: string;
    email: string;
    specialization: string;
    status: 'active' | 'inactive' | 'pending';
    createdAt: string;
    lastLogin?: string;
  }>>([]);
  const [newUserDialogOpen, setNewUserDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'farmer',
    specialization: ''
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    setError('');

    try {
      // In a real implementation, these would be API calls to the backend
      // For demo purposes, we'll simulate the data
      setUsers(generateMockUsers());
      setResearchers(generateMockResearchers());
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadUsers();
  };

  const handleCreateUser = async () => {
    try {
      // In a real implementation, this would be an API call to create a user
      // For demo purposes, we'll just close the dialog and refresh
      setNewUserDialogOpen(false);
      setNewUser({
        name: '',
        email: '',
        role: 'farmer',
        specialization: ''
      });
      loadUsers();
    } catch (err) {
      console.error('Error creating user:', err);
      setError('Failed to create user. Please try again.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      // In a real implementation, this would be an API call to delete a user
      // For demo purposes, we'll just refresh the list
      loadUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user. Please try again.');
    }
  };

  const renderUserManagement = () => {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>User Management</CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="default" size="sm" onClick={() => setNewUserDialogOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
          </div>
          <CardDescription>Manage system users and their roles</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.status === 'active' ? 'default' : user.status === 'pending' ? 'secondary' : 'destructive'}>
                      {user.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  const renderResearcherManagement = () => {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Researcher Management</CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="default" size="sm" onClick={() => setNewUserDialogOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Researcher
              </Button>
            </div>
          </div>
          <CardDescription>Manage researchers and their specializations</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Specialization</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {researchers.map((researcher) => (
                <TableRow key={researcher.id}>
                  <TableCell>{researcher.name}</TableCell>
                  <TableCell>{researcher.email}</TableCell>
                  <TableCell>{researcher.specialization}</TableCell>
                  <TableCell>
                    <Badge variant={researcher.status === 'active' ? 'default' : researcher.status === 'pending' ? 'secondary' : 'destructive'}>
                      {researcher.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(researcher.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{researcher.lastLogin ? new Date(researcher.lastLogin).toLocaleDateString() : 'Never'}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(researcher.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  return (
    <AuthGuard requiredRole="admin">
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">User Management</h1>
          <Button variant="outline" onClick={() => router.push('/admin/dashboard')}>
            Back to Dashboard
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="users">
              <User className="h-4 w-4 mr-2" />
              System Users
            </TabsTrigger>
            <TabsTrigger value="researchers">
              <Users className="h-4 w-4 mr-2" />
              Researchers
            </TabsTrigger>
          </TabsList>
          <TabsContent value="users">
            {renderUserManagement()}
          </TabsContent>
          <TabsContent value="researchers">
            {renderResearcherManagement()}
          </TabsContent>
        </Tabs>

        <Dialog open={newUserDialogOpen} onOpenChange={setNewUserDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Create a new user account in the system.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Role
                </Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="farmer">Farmer</SelectItem>
                    <SelectItem value="lab">Lab Technician</SelectItem>
                    <SelectItem value="processor">Processor</SelectItem>
                    <SelectItem value="researcher">Researcher</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newUser.role === 'researcher' && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="specialization" className="text-right">
                    Specialization
                  </Label>
                  <Input
                    id="specialization"
                    value={newUser.specialization}
                    onChange={(e) => setNewUser({ ...newUser, specialization: e.target.value })}
                    className="col-span-3"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewUserDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateUser}>Create User</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  );
}

// Helper functions to generate mock data for the demo
function generateMockUsers() {
  const users = [
    {
      id: '1',
      name: 'Admin User',
      email: 'admin@traceya.com',
      role: 'admin',
      status: 'active',
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60000).toISOString(),
      lastLogin: new Date(Date.now() - 2 * 60 * 60000).toISOString()
    },
    {
      id: '2',
      name: 'John Farmer',
      email: 'john@farm.com',
      role: 'farmer',
      status: 'active',
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60000).toISOString(),
      lastLogin: new Date(Date.now() - 24 * 60 * 60000).toISOString()
    },
    {
      id: '3',
      name: 'Lisa Lab',
      email: 'lisa@lab.com',
      role: 'lab',
      status: 'active',
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60000).toISOString(),
      lastLogin: new Date(Date.now() - 3 * 24 * 60 * 60000).toISOString()
    },
    {
      id: '4',
      name: 'Paul Processor',
      email: 'paul@processor.com',
      role: 'processor',
      status: 'inactive',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60000).toISOString(),
      lastLogin: new Date(Date.now() - 15 * 24 * 60 * 60000).toISOString()
    },
    {
      id: '5',
      name: 'New User',
      email: 'newuser@traceya.com',
      role: 'farmer',
      status: 'pending',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60000).toISOString()
    },
  ];

  return users as Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    status: 'active' | 'inactive' | 'pending';
    createdAt: string;
    lastLogin?: string;
  }>;
}

function generateMockResearchers() {
  const researchers = [
    {
      id: '1',
      name: 'Dr. Sarah Smith',
      email: 'sarah@research.org',
      specialization: 'Botanical Analysis',
      status: 'active',
      createdAt: new Date(Date.now() - 120 * 24 * 60 * 60000).toISOString(),
      lastLogin: new Date(Date.now() - 1 * 24 * 60 * 60000).toISOString()
    },
    {
      id: '2',
      name: 'Dr. Michael Johnson',
      email: 'michael@research.org',
      specialization: 'Chemical Composition',
      status: 'active',
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60000).toISOString(),
      lastLogin: new Date(Date.now() - 5 * 24 * 60 * 60000).toISOString()
    },
    {
      id: '3',
      name: 'Dr. Emily Chen',
      email: 'emily@research.org',
      specialization: 'Genetic Analysis',
      status: 'inactive',
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60000).toISOString(),
      lastLogin: new Date(Date.now() - 30 * 24 * 60 * 60000).toISOString()
    },
    {
      id: '4',
      name: 'Dr. Robert Williams',
      email: 'robert@research.org',
      specialization: 'Quality Assurance',
      status: 'pending',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60000).toISOString()
    },
  ];

  return researchers as Array<{
    id: string;
    name: string;
    email: string;
    specialization: string;
    status: 'active' | 'inactive' | 'pending';
    createdAt: string;
    lastLogin?: string;
  }>;
}