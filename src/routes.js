import React from 'react'

const Dashboard = React.lazy(() => import('./views/dashboard/Dashboard'))
const Users = React.lazy(() => import('./views/users/Users'))
const UserDetails = React.lazy(() => import('./views/users/UserDetails'))
const EditPatient = React.lazy(() => import('./views/patients/EditPatient'))
const EditProfessional = React.lazy(() => import('./views/professionals/EditProfessional'))
const Appointments = React.lazy(() => import('./views/appointments/Appointments'))
const Professionls = React.lazy(() => import('./views/professionals/Professionals'))
const Patients = React.lazy(() => import('./views/patients/Patients'))
const Profile = React.lazy(() => import('./views/profile/Profile'))
const EditAppointment = React.lazy(() => import('./views/appointments/EditAppointment'))
const EditMedicalHistory = React.lazy(() => import('./views/medicalHistory/EditMedicalHistory'))
const MedicalHistory = React.lazy(() => import('./views/medicalHistory/MedicalHistory'))
const Widgets = React.lazy(() => import('./views/widgets/Widgets'))

const routes = [
  { path: '/', exact: true, name: 'Home' },
  { path: '/dashboard', name: 'Dashboard', element: Dashboard },
  { path: '/users', name: 'Users', element: Users },
  { path: '/users/:id', name: 'UserDetails', element: UserDetails },
  { path: '/appointments', name: 'Appointments', element: Appointments },
  { path: '/appointments/:id', name: 'EditAppointment', element: EditAppointment },
  { path: '/professionals', name: 'Professionals', element: Professionls },
  { path: '/professionals/:id', name: 'EditProfessional', element: EditProfessional },
  { path: '/patients', name: 'Patients', element: Patients },
  { path: '/patients/:id', name: 'EditPatient', element: EditPatient },
  { path: '/profile', name: 'Profile', element: Profile },
  { path: '/medicalHistory', name: 'MedicalHistory', element: MedicalHistory },
  { path: '/medicalHistory/:id', name: 'EditMedicalHistory', element: EditMedicalHistory },
  { path: '/widgets', name: 'Widgets', element: Widgets },
]

export default routes
