import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Plus, 
  Edit, 
  Trash, 
  User, 
  Lock, 
  LogOut, 
  CheckCircle, 
  Circle 
} from "lucide-react";

// Mock authentication service
const AuthService = {
  login: (email, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email === "user@example.com" && password === "password") {
          resolve({
            id: "1",
            name: "John Doe",
            email: "user@example.com"
          });
        } else {
          reject(new Error("Invalid credentials"));
        }
      }, 500);
    });
  },
  signup: (name, email, password) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: "2",
          name,
          email
        });
      }, 500);
    });
  }
};

// Mock task service
const TaskService = {
  getTasks: () => {
    const tasks = localStorage.getItem("tasks");
    return Promise.resolve(tasks ? JSON.parse(tasks) : []);
  },
  addTask: (task) => {
    return TaskService.getTasks().then(tasks => {
      const newTask = {
        id: Date.now().toString(),
        ...task,
        createdAt: new Date().toISOString()
      };
      const updatedTasks = [...tasks, newTask];
      localStorage.setItem("tasks", JSON.stringify(updatedTasks));
      return newTask;
    });
  },
  updateTask: (id, updates) => {
    return TaskService.getTasks().then(tasks => {
      const updatedTasks = tasks.map(task => 
        task.id === id ? { ...task, ...updates } : task
      );
      localStorage.setItem("tasks", JSON.stringify(updatedTasks));
      const updatedTask = updatedTasks.find(task => task.id === id);
      return updatedTask;
    });
  },
  deleteTask: (id) => {
    return TaskService.getTasks().then(tasks => {
      const updatedTasks = tasks.filter(task => task.id !== id);
      localStorage.setItem("tasks", JSON.stringify(updatedTasks));
    });
  }
};

export default function TaskManager() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoginView, setIsLoginView] = useState(true);
  
  // Form states
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({ name: "", email: "", password: "" });
  const [taskForm, setTaskForm] = useState({ title: "", description: "" });
  
  // Task state
  const [tasks, setTasks] = useState([]);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", description: "" });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check authentication status on mount
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const storedUser = localStorage.getItem("user");
    
    if (token && storedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(storedUser));
      loadTasks();
    }
  }, []);

  // Load tasks
  const loadTasks = () => {
    TaskService.getTasks().then(setTasks);
  };

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const userData = await AuthService.login(loginForm.email, loginForm.password);
      const token = "mock-jwt-token"; // In a real app, this would come from the server
      
      localStorage.setItem("authToken", token);
      localStorage.setItem("user", JSON.stringify(userData));
      
      setUser(userData);
      setIsAuthenticated(true);
      loadTasks();
    } catch (err) {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  // Handle signup
  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const userData = await AuthService.signup(
        signupForm.name, 
        signupForm.email, 
        signupForm.password
      );
      const token = "mock-jwt-token";
      
      localStorage.setItem("authToken", token);
      localStorage.setItem("user", JSON.stringify(userData));
      
      setUser(userData);
      setIsAuthenticated(true);
      loadTasks();
    } catch (err) {
      setError("Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    localStorage.removeItem("tasks");
    setIsAuthenticated(false);
    setUser(null);
    setTasks([]);
  };

  // Add new task
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;
    
    try {
      const newTask = await TaskService.addTask({
        title: taskForm.title,
        description: taskForm.description,
        completed: false
      });
      setTasks([...tasks, newTask]);
      setTaskForm({ title: "", description: "" });
    } catch (err) {
      setError("Failed to add task");
    }
  };

  // Start editing task
  const startEditing = (task) => {
    setEditingTaskId(task.id);
    setEditForm({
      title: task.title,
      description: task.description
    });
  };

  // Save edited task
  const saveEdit = async () => {
    if (!editingTaskId) return;
    
    try {
      const updatedTask = await TaskService.updateTask(editingTaskId, {
        title: editForm.title,
        description: editForm.description
      });
      
      setTasks(tasks.map(task => 
        task.id === editingTaskId ? updatedTask : task
      ));
      
      setEditingTaskId(null);
    } catch (err) {
      setError("Failed to update task");
    }
  };

  // Toggle task completion
  const toggleTaskCompletion = async (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    try {
      const updatedTask = await TaskService.updateTask(id, {
        completed: !task.completed
      });
      
      setTasks(tasks.map(t => 
        t.id === id ? updatedTask : t
      ));
    } catch (err) {
      setError("Failed to update task");
    }
  };

  // Delete task
  const deleteTask = async (id) => {
    try {
      await TaskService.deleteTask(id);
      setTasks(tasks.filter(task => task.id !== id));
    } catch (err) {
      setError("Failed to delete task");
    }
  };

  // Render login/signup form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              {isLoginView ? "Login to Task Manager" : "Create Account"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}
            
            {isLoginView ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      className="pl-10"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
                
                <div className="text-center text-sm">
                  <span className="text-gray-600">Don't have an account? </span>
                  <button
                    type="button"
                    className="text-blue-600 hover:underline"
                    onClick={() => setIsLoginView(false)}
                  >
                    Sign up
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={signupForm.name}
                    onChange={(e) => setSignupForm({...signupForm, name: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your@email.com"
                      className="pl-10"
                      value={signupForm.email}
                      onChange={(e) => setSignupForm({...signupForm, email: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={signupForm.password}
                      onChange={(e) => setSignupForm({...signupForm, password: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account..." : "Sign Up"}
                </Button>
                
                <div className="text-center text-sm">
                  <span className="text-gray-600">Already have an account? </span>
                  <button
                    type="button"
                    className="text-blue-600 hover:underline"
                    onClick={() => setIsLoginView(true)}
                  >
                    Sign in
                  </button>
                </div>
              </form>
            )}
            
            <div className="mt-6 text-center text-xs text-gray-500">
              <p>Demo credentials: user@example.com / password</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render task manager
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center py-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Task Manager</h1>
            <p className="text-gray-600">Welcome back, {user?.name}</p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </header>

        {/* Add Task Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add New Task</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddTask} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Task Title</Label>
                <Input
                  id="title"
                  placeholder="What needs to be done?"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Add details..."
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                />
              </div>
              
              <Button type="submit" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Task
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Task List */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">Your Tasks</h2>
            <p className="text-gray-600">
              {tasks.filter(t => !t.completed).length} pending, {tasks.filter(t => t.completed).length} completed
            </p>
          </div>
          
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
          
          {tasks.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-gray-500">No tasks yet. Add your first task above!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <Card 
                  key={task.id} 
                  className={`p-4 ${task.completed ? 'bg-green-50 border-green-200' : 'bg-white'}`}
                >
                  {editingTaskId === task.id ? (
                    <div className="space-y-3">
                      <Input
                        value={editForm.title}
                        onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                        className="font-medium"
                      />
                      <Textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                        className="text-sm"
                      />
                      <div className="flex gap-2">
                        <Button onClick={saveEdit} size="sm">Save</Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setEditingTaskId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto mt-1"
                        onClick={() => toggleTaskCompletion(task.id)}
                      >
                        {task.completed ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-400" />
                        )}
                      </Button>
                      
                      <div className="flex-1">
                        <h3 className={`font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className={`text-sm mt-1 ${task.completed ? 'text-gray-400' : 'text-gray-600'}`}>
                            {task.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          Created: {new Date(task.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing(task)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTask(task.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}