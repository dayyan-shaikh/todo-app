const API_BASE_URL = "http://localhost:8000/api/v1";

export interface Todo {
  id: string;
  title: string;
  is_done: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTodoData {
  title: string;
}

export interface UpdateTodoData {
  title?: string;
  is_done?: boolean;
}

class TodoService {
  private getAuthHeaders() {
    const token = localStorage.getItem("access_token");
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    };
  }

  async getAllTodos(): Promise<Todo[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/todos`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch todos");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching todos:", error);
      throw error;
    }
  }

  async getDoneTodos(): Promise<Todo[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/todo/done`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch done todos");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching done todos:", error);
      throw error;
    }
  }

  async getTodoById(id: string): Promise<Todo> {
    try {
      const response = await fetch(`${API_BASE_URL}/todo/${id}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch todo");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching todo:", error);
      throw error;
    }
  }

  async createTodo(data: CreateTodoData): Promise<Todo> {
    try {
      const response = await fetch(`${API_BASE_URL}/todos`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create todo");
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating todo:", error);
      throw error;
    }
  }

  async updateTodo(id: string, data: UpdateTodoData): Promise<Todo> {
    try {
      const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update todo");
      }

      return await response.json();
    } catch (error) {
      console.error("Error updating todo:", error);
      throw error;
    }
  }

  async deleteTodo(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to delete todo");
      }
    } catch (error) {
      console.error("Error deleting todo:", error);
      throw error;
    }
  }

  async toggleTodoStatus(id: string, isDone: boolean): Promise<Todo> {
    return this.updateTodo(id, { is_done: isDone });
  }
}

export const todoService = new TodoService(); 