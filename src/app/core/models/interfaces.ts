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
  instructor_id?: string;
  users?: {
    firstname: string;
    lastname: string;
    avatar_url?: string;
  };
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

export interface LessonAttachment {
  id: string;
  lesson_id: string;
  title: string;
  url: string;
  file_type: string; // sincronizado com SQL — não usar 'type'
  created_at?: string;
}

export interface AndonAlert {
  id: string;
  user_id: string;
  user_name: string;
  course_id: string;
  lesson_id: string;
  description: string;
  status: 'pending' | 'resolved';
  created_at: string;
  courses?: { title: string };
  lessons?: { title: string };
}
