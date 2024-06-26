import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import ErrorBoundary from './components/ErrorBoundary.jsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        path: 'gen/:genId',
        element: <App />,
      },
      {
        path: 'gen/:genId/:pokeId',
        element: <App />,
      },
      {
        path: 'gen/:genId/:pokeId/:formId',
        element: <App />,
      }
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
    <RouterProvider router={router} />
)
