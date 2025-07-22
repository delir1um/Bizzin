// Simple auth context for the application
// This replaces Supabase with a lightweight auth system

export interface User {
  id: string;
  email: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
}

// Mock auth service - replace with your actual auth implementation
class AuthService {
  private user: User | null = null;

  async signIn(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
    // Mock sign in - replace with actual API call
    if (email && password) {
      this.user = { id: '1', email };
      return { user: this.user, error: null };
    }
    return { user: null, error: 'Invalid credentials' };
  }

  async signUp(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
    // Mock sign up - replace with actual API call
    if (email && password) {
      this.user = { id: '1', email };
      return { user: this.user, error: null };
    }
    return { user: null, error: 'Registration failed' };
  }

  async signOut(): Promise<void> {
    this.user = null;
  }

  getCurrentUser(): User | null {
    return this.user;
  }
}

export const authService = new AuthService();
