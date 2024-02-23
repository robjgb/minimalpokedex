import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import ErrorBoundary from './ErrorBoundary.jsx';


const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        path: 'gen/:genId',
        element: <App />,
        children: [
          {
            path: ':pokeId',
            element: <App />,
          }
        ]
      },
      {
        path: ':pokeId',
        element: <App />,
      }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
    <RouterProvider router={router} />
)
