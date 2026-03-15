import { useEffect } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import RestaurantView from './pages/RestaurantView';
import MyRestaurants from './pages/MyRestaurants';
import SearchResults from './pages/SearchResults';

import Login from './pages/auth/Login';
import SignUp from './pages/auth/SignUp';
import VerifyEmail from './pages/auth/VerifyEmail';
import ForgotPassword from './pages/auth/ForgotPassword';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PublicRoute from './components/auth/PublicRoute';
import { useAppStore } from './store/useAppStore';

import Layout from './components/layout/Layout';
import { ToastContainer } from './components/ui/Toast';

const router = createBrowserRouter([
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          { path: '/', element: <Home /> },
          { path: '/search', element: <SearchResults /> },
          { path: '/restaurants', element: <MyRestaurants /> },
          { path: '/profile', element: <Profile /> },
          { path: '/settings', element: <Settings /> },
          { path: '/restaurant/:id', element: <RestaurantView /> },
        ],
      }
    ]
  },
  {
    element: <PublicRoute />,
    children: [
      { path: '/login', element: <Login /> },
      { path: '/signup', element: <SignUp /> },
      { path: '/verify-email', element: <VerifyEmail /> },
      { path: '/forgot-password', element: <ForgotPassword /> },
    ]
  }
]);

function App() {
  const { initApp } = useAppStore();

  useEffect(() => {
    initApp();
  }, [initApp]);

  return (
    <>
      <ToastContainer />
      <RouterProvider router={router} />
    </>
  );
}

export default App;
