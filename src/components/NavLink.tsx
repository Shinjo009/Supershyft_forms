import type { ReactNode } from 'react'
import './NavLink.css'

type NavLinkProps = {
  href: string
  children: ReactNode
  external?: boolean
}

export function NavLink({ href, children, external }: NavLinkProps) {
  if (external || href.startsWith('http')) {
    return (
      <a
        className="nav-link"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    )
  }

  return (
    <a className="nav-link" href={href}>
      {children}
    </a>
  )
}
