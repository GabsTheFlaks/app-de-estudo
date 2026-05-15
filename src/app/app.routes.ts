import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  // Auth routes (públicas, sem layout)
  {
    path: 'login',
    title: 'Login — SIMA',
    loadComponent: () => import('./features/auth/login.page').then(m => m.LoginPage)
  },
  {
    path: 'register',
    title: 'Cadastro — SIMA',
    loadComponent: () => import('./features/auth/register.page').then(m => m.RegisterPage)
  },

  // Rotas protegidas (com layout)
  {
    path: '',
    loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        title: 'Turmas — SIMA',
        loadComponent: () => import('./features/dashboard/dashboard.page').then(m => m.DashboardPage)
      },
      {
        path: 'saved-lessons',
        title: 'Salvos — SIMA',
        loadComponent: () => import('./features/profile/saved-lessons.page').then(m => m.SavedLessonsPage)
      },
      {
        path: 'my-courses',
        title: 'Minhas Inscrições — SIMA',
        loadComponent: () => import('./features/profile/my-courses.page').then(m => m.MyCoursesPage)
      },
      {
        path: 'course/:id',
        title: 'Turma — SIMA',
        loadComponent: () => import('./features/course/class.page').then(m => m.ClassPage)
      },
      {
        path: 'course/:id/viewer',
        title: 'Visualizador — SIMA',
        loadComponent: () => import('./features/course/viewer.page').then(m => m.ViewerPage)
      },
      {
        path: 'lesson/:id/viewer',
        title: 'Aula — SIMA',
        loadComponent: () => import('./features/lesson/lesson-viewer.page').then(m => m.LessonViewerPage)
      },
      {
        path: 'course/:id/lesson/new',
        title: 'Nova Aula — SIMA',
        loadComponent: () => import('./features/lesson/lesson-admin.page').then(m => m.LessonAdminPage),
        canActivate: [adminGuard]
      },
      {
        path: 'admin',
        title: 'Administração — SIMA',
        loadComponent: () => import('./features/admin/admin.page').then(m => m.AdminPage),
        canActivate: [adminGuard]
      },
      {
        path: 'profile',
        title: 'Meu Perfil — SIMA',
        loadComponent: () => import('./features/profile/profile.page').then(m => m.ProfilePage)
      },
      {
        path: 'settings',
        title: 'Configurações — SIMA',
        loadComponent: () => import('./features/profile/settings.page').then(m => m.SettingsPage)
      }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
