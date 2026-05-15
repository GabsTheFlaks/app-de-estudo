// Centralized interfaces for the application

export interface AppUser {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  role: 'student' | 'admin';
  avatar_url?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  link_drive: string;
  file_type: string;
  thumbnail_url: string;
  announcement?: string | null;
}

export interface Lesson {
  id?: string;
  course_id: string;
  title: string;
  description?: string;
  file_type: string;
  link_drive: string;
  order?: number;
  created_at?: string;
}

export interface Comment {
  id?: string;
  lesson_id: string;
  user_id: string;
  user_name: string;
  avatar_url?: string;
  content: string;
  created_at?: string;
}
