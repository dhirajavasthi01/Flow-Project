import { createBrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import IndividualDetailWrapper from './features/individualDetailWrapper/individualDetailWrapper.jsx'
import Overview from './features/individualDetailWrapper/features/overview/Overview.jsx'
import Edit from './features/individualDetailWrapper/features/edit/Edit.jsx'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    element: <IndividualDetailWrapper />,
    children: [
      {
        path: 'overview',
        element: <Overview />,
      },
      {
        path: 'overview/edit',
        element: <Edit />,
      },
    ],
  },
])

