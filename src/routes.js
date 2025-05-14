import React from 'react'

const Dashboard = React.lazy(() => import('./views/dashboard/Dashboard'))
const Users = React.lazy(() => import('./views/users/Users'))
const UserDetails = React.lazy(() => import('./views/users/UserDetails'))
const Appointments = React.lazy(() => import('./views/appointments/Appointments'))
const Professionls = React.lazy(() => import('./views/professionals/Professionals'))
const Patients = React.lazy(() => import('./views/patients/Patients'))
const Profile = React.lazy(() => import('./views/profile/Profile'))
const EditAppointment = React.lazy(() => import('./views/appointments/EditAppointment'))

const Widgets = React.lazy(() => import('./views/widgets/Widgets'))

const routes = [
  { path: '/', exact: true, name: 'Home' },
  { path: '/dashboard', name: 'Dashboard', element: Dashboard },
  { path: '/users', name: 'Users', element: Users },
  { path: '/users/:id', name: 'UserDetails', element: UserDetails },
  { path: '/appointments', name: 'Appointments', element: Appointments },
  { path: '/appointments/:id', name: 'EditAppointment', element: EditAppointment },
  { path: '/professionals', name: 'Professionals', element: Professionls },
  { path: '/patients', name: 'Patients', element: Patients },
  { path: '/profile', name: 'Profile', element: Profile },
  { path: '/widgets', name: 'Widgets', element: Widgets },
]

export default routes
