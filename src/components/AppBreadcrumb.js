import React from 'react'
import { useLocation } from 'react-router-dom'

import routes from '../routes'

import { CBreadcrumb, CBreadcrumbItem } from '@coreui/react'

// Función para capitalizar la primera letra
const capitalizeFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

const AppBreadcrumb = () => {
  const currentLocation = useLocation()
  const pathname = currentLocation.pathname

  const getRouteName = (pathname, routes) => {
    const currentRoute = routes.find((route) => route.path === pathname)
    return currentRoute ? currentRoute.name : false
  }

  const getBreadcrumbs = (location) => {
    const breadcrumbs = []
    location.split('/').reduce((prev, curr, index, array) => {
      // Evita agregar rutas vacías
      if (!curr) return prev

      const currentPathname = `${prev}/${curr}`.replace(/\/\//g, '/') // Asegura que no haya dobles barras
      const routeName = getRouteName(currentPathname, routes)
      routeName &&
        breadcrumbs.push({
          pathname: currentPathname,
          name: routeName,
          active: index + 1 === array.length ? true : false,
        })
      return currentPathname
    }, '')
    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs(pathname)

  // Detecta si estamos en la página de detalles del usuario
  const isUserDetailsPage = pathname.startsWith('/users/') && pathname.split('/').length === 3
  let userName = null

  if (isUserDetailsPage) {
    const userId = pathname.split('/')[2]
    const storedUser = localStorage.getItem('selectedUser')
    let firstName = null

    if (storedUser) {
      try {
        const user = JSON.parse(storedUser)
        firstName = user?.first_name?.split(' ')[0] || `User ${userId}`
      } catch (e) {
        console.error('Error parsing selectedUser from localStorage:', e)
        firstName = `User ${userId}`
      }
    } else {
      firstName = `User ${userId}`
    }

    userName = capitalizeFirstLetter(firstName)
  }

  return (
    <CBreadcrumb className="my-0">
      <CBreadcrumbItem href="/">Home</CBreadcrumbItem>
      {breadcrumbs.map((breadcrumb, index) => (
        <CBreadcrumbItem
          {...(breadcrumb.active ? { active: true } : { href: `#${breadcrumb.pathname}` })}
          key={index}
        >
          {capitalizeFirstLetter(breadcrumb.name)}
        </CBreadcrumbItem>
      ))}
      {isUserDetailsPage && <CBreadcrumbItem active>{userName}</CBreadcrumbItem>}
    </CBreadcrumb>
  )
}

export default React.memo(AppBreadcrumb)
