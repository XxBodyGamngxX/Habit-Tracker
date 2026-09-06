import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProviders } from '@/context/AppProviders';
import { MainLayout } from '@/components/layout/MainLayout';
import { StandaloneLayout } from '@/components/layout/StandaloneLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

import { Login } from '@/pages/Login';
import { Home } from '@/pages/Home';
import { Habits } from '@/pages/Habits';
import { Todo } from '@/pages/Todo';
import { Pomodoro } from '@/pages/Pomodoro';
import { Finance } from '@/pages/Finance';
import { Store } from '@/pages/Store';
import { Community } from '@/pages/Community';
import { Playlists } from '@/pages/Playlists';
import { Settings } from '@/pages/Settings';
import { Admin } from '@/pages/Admin';

import { StandalonePomodoro } from '@/pages/standalone/StandalonePomodoro';
import { StandaloneTodo } from '@/pages/standalone/StandaloneTodo';

export function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Application Routes */}
          <Route element={<ProtectedRoute />}>
            {/* Main Workspace Layout */}
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Home />} />
              <Route path="habits" element={<Habits />} />
              <Route path="todo" element={<Todo />} />
              <Route path="pomodoro" element={<Pomodoro />} />
              <Route path="finance" element={<Finance />} />
              <Route path="store" element={<Store />} />
              <Route path="community" element={<Community />} />
              <Route path="playlist" element={<Playlists />} />
              <Route path="settings" element={<Settings />} />
              <Route path="admin" element={<Admin />} />
            </Route>

            {/* Minimal Distraction-Free Standalone Routes */}
            <Route path="/standalone" element={<StandaloneLayout />}>
              <Route path="pomodoro" element={<StandalonePomodoro />} />
              <Route path="todo" element={<StandaloneTodo />} />
            </Route>
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProviders>
  );
}

export default App;
