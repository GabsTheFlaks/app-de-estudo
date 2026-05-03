import {Routes} from '@angular/router';
import { LoginPage } from './login.page';
import { RegisterPage } from './register.page';
import { DashboardPage } from './dashboard.page';
import { ViewerPage } from './viewer.page';
import { ClassPage } from './class.page';
import { LessonAdminPage } from './lesson-admin.page';
import { LessonViewerPage } from './lesson-viewer.page';
import { AdminPage } from './admin.page';
import { MyCoursesPage } from './my-courses.page';
import { ProfilePage } from './profile.page';
import { SettingsPage } from './settings.page';
import { SavedLessonsPage } from './saved-lessons.page';
import { LayoutComponent } from './layout.component';
import { authGuard } from './auth.guard';
import { adminGuard } from './admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginPage },
  { path: 'register', component: RegisterPage },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardPage },
      { path: 'saved-lessons', component: SavedLessonsPage },
      { path: 'my-courses', component: MyCoursesPage },
      { path: 'course/:id', component: ClassPage },
      { path: 'course/:id/viewer', component: ViewerPage },
      { path: 'course/:id/lesson/new', component: LessonAdminPage, canActivate: [adminGuard] },
      { path: 'lesson/:id/viewer', component: LessonViewerPage },
      { path: 'admin', component: AdminPage, canActivate: [adminGuard] },
      { path: 'profile', component: ProfilePage },
      { path: 'settings', component: SettingsPage }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
