import { useState, useEffect } from "react";
import type { Route } from "./+types/home";
import { useAuth } from "../lib/auth";
import { todoService, type Todo } from "../lib/todoService";
import { LogOut, Plus, Trash2, CheckCircle, Circle, Edit3, X } from "lucide-react";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "../components/ui/alert";
import { Skeleton } from "../components/ui/skeleton";
import { ScrollArea } from "../components/ui/scroll-area";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Home - Todo App" },
    { name: "description", content: "Welcome to your Todo App dashboard!" },
  ];
}

function HomeContent() {
  const { user, logout } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [isAddingTodo, setIsAddingTodo] = useState(false);
  const [editingTodo, setEditingTodo] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  useEffect(() => {
    loadTodos();
  }, []);

  const loadTodos = async () => {
    try {
      setLoading(true);
      const fetchedTodos = await todoService.getAllTodos();
      setTodos(fetchedTodos);
    } catch (err: any) {
      setError(err.message || "Failed to load todos");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;

    try {
      setIsAddingTodo(true);
      const newTodo = await todoService.createTodo({ title: newTodoTitle.trim() });
      setTodos([...todos, newTodo]);
      setNewTodoTitle("");
    } catch (err: any) {
      setError(err.message || "Failed to create todo");
    } finally {
      setIsAddingTodo(false);
    }
  };

  const handleToggleTodo = async (todo: Todo) => {
    try {
      const updatedTodo = await todoService.toggleTodoStatus(todo.id, !todo.is_done);
      setTodos(todos.map(t => t.id === todo.id ? updatedTodo : t));
    } catch (err: any) {
      setError(err.message || "Failed to update todo");
    }
  };

  const handleDeleteTodo = async (id: string) => {
    try {
      await todoService.deleteTodo(id);
      setTodos(todos.filter(t => t.id !== id));
    } catch (err: any) {
      setError(err.message || "Failed to delete todo");
    }
  };

  const handleEditTodo = async (id: string) => {
    if (!editTitle.trim()) return;

    try {
      const updatedTodo = await todoService.updateTodo(id, { title: editTitle.trim() });
      setTodos(todos.map(t => t.id === id ? updatedTodo : t));
      setEditingTodo(null);
      setEditTitle("");
    } catch (err: any) {
      setError(err.message || "Failed to update todo");
    }
  };

  const startEditing = (todo: Todo) => {
    setEditingTodo(todo.id);
    setEditTitle(todo.title);
  };

  const cancelEditing = () => {
    setEditingTodo(null);
    setEditTitle("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Skeleton className="w-80 h-40 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Todo App</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.username}
              </span>
              <button
                onClick={logout}  className="flex flex-row item-center justify-center gap-2 border-1 rounded-md py-2 px-3 cursor-pointer bg-blue-600 hover:bg-blue-500 text-white">
                <LogOut className="w-4 h-4 mt-[2px]" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Error Display */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
              <Button variant="ghost" size="sm" onClick={() => setError("")} className="float-right">×</Button>
            </Alert>
          )}

          {/* Add Todo Form */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add New Todo</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddTodo} className="flex gap-2">
                <Input
                  type="text"
                  value={newTodoTitle}
                  onChange={(e) => setNewTodoTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  disabled={isAddingTodo}
                />
                <Button type="submit" className="bg-blue-600 hover:bg-blue-400" disabled={isAddingTodo || !newTodoTitle.trim()}>
                  {isAddingTodo ? <Skeleton className="w-4 h-4 rounded-full mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  Add
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Todos List */}
          <Card>
            <CardHeader>
              <CardTitle>Your Todos ({todos.length})</CardTitle>
            </CardHeader>
            <CardContent className="overflow-hidden">
              {todos.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No todos yet. Add one above to get started!
                </div>
              ) : (
                todos.length > 4 ? (
                  <ScrollArea className="h-80 w-full">
                    <div className="divide-y divide-gray-200">
                      {todos.map((todo) => (
                        <div key={todo.id} className="p-4 hover:bg-gray-50">
                          {editingTodo === todo.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleEditTodo(todo.id)}
                                autoFocus
                              />
                              <Button size="sm" className="px-2 py-2" onClick={() => handleEditTodo(todo.id)}>Save</Button>
                              <Button size="sm" className="px-2 py-2" onClick={cancelEditing}>Cancel</Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <Button variant="ghost" size="icon" onClick={() => handleToggleTodo(todo)}>
                                {todo.is_done ? (
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                ) : (
                                  <Circle className="h-5 w-5" />
                                )}
                              </Button>
                              <span
                                className={`flex-1 ${todo.is_done ? 'line-through text-gray-500' : 'text-gray-900'}`}
                              >
                                {todo.title}
                              </span>
                              <div className="flex items-center">
                                <Button variant="ghost" size="icon" onClick={() => startEditing(todo)}>
                                  <Edit3 className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteTodo(todo.id)}>
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {todos.map((todo) => (
                      <div key={todo.id} className="p-4 hover:bg-gray-50">
                        {editingTodo === todo.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleEditTodo(todo.id)}
                              autoFocus
                            />
                            <Button size="sm" className="px-2 py-2" onClick={() => handleEditTodo(todo.id)}>Save</Button>
                            <Button size="sm" className="px-2 py-2" onClick={cancelEditing}>Cancel</Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <Button variant="ghost" size="icon" onClick={() => handleToggleTodo(todo)}>
                              {todo.is_done ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : (
                                <Circle className="h-5 w-5" />
                              )}
                            </Button>
                            <span
                              className={`flex-1 ${todo.is_done ? 'line-through text-gray-500' : 'text-gray-900'}`}
                            >
                              {todo.title}
                            </span>
                            <div className="flex items-center">
                              <Button variant="ghost" size="icon" onClick={() => startEditing(todo)}>
                                <Edit3 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteTodo(todo.id)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <ProtectedRoute>
      <HomeContent />
    </ProtectedRoute>
  );
}
