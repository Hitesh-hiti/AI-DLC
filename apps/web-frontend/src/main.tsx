import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';
import App from './App.tsx';
import { BookingRoute } from './routes/BookingRoute.tsx';
import { TripDetailPage } from './pages/TripDetailPage.tsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/booking',
    element: <BookingRoute />,
  },
  {
    path: '/trip/:tripId',
    element: <TripDetailPage />,
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
