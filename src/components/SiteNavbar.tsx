import { NavLink } from './NavLink'

const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'Our Tech', href: '/our-tech' },
  { label: 'Our Story', href: '/our-story' },
  { label: 'Contact Us', href: '/contact-us' },
] as const

export function SiteNavbar() {
  return (
    <header className="bs-header bg-[linear-gradient(135deg,#0a4a42_0%,#063533_55%,#042824_100%)]">
      <nav className="navbar mx-auto flex max-w-[1200px] items-center justify-center px-6 py-4">
        <div className="offcanvas-body">
          <ul className="navbar-nav m-0 flex list-none flex-wrap items-center justify-center gap-8 p-0">
            {NAV_ITEMS.map((item) => (
              <li key={item.href} className="nav-item">
                <NavLink href={item.href}>{item.label}</NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  )
}
