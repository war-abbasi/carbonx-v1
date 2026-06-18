import { Link } from 'react-router-dom';
import { Logo } from './Logo';

const footerLinks = {
  Platform: [
    { label: 'Features',     to: '/features' },
    { label: 'How It Works', to: '/how-it-works' },
    { label: 'Calculator',   to: '/calculator' },
    { label: 'API Docs',     to: '#' },
    { label: 'Integrations', to: '#' },
  ],
  Solutions: [
    { label: 'For Enterprises',  to: '#' },
    { label: 'For SMBs',         to: '#' },
    { label: 'For Governments',  to: '#' },
    { label: 'ESG Reporting',    to: '#' },
    { label: 'Case Studies',     to: '#' },
  ],
  Company: [
    { label: 'About',   to: '/about' },
    { label: 'Blog',    to: '#' },
    { label: 'Careers', to: '#' },
    { label: 'Press',   to: '#' },
    { label: 'Contact', to: '/contact' },
  ],
};

export default function Footer() {
  return (
    <footer
      className="border-t pt-14 pb-8"
      style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Logo className="h-14 w-36 mb-4" />
            <p className="text-sm leading-relaxed max-w-xs" style={{ color: 'var(--text-muted)' }}>
              AI-powered sustainability intelligence for organizations that demand precision, foresight, and measurable environmental impact.
            </p>
            <p
              className="mt-5 font-mono text-xs tracking-[0.08em]"
              style={{ color: 'var(--accent)' }}
            >
              ◆ Building a smarter, more sustainable future
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([col, links]) => (
            <div key={col}>
              <p
                className="text-xs font-semibold uppercase tracking-[0.1em] mb-5"
                style={{ color: 'var(--text-dim)' }}
              >
                {col}
              </p>
              <ul className="space-y-2.5">
                {links.map((l) => (
                  <li key={l.label}>
                    <Link
                      to={l.to}
                      className="text-sm transition-colors duration-200 hover:text-accent"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t text-xs"
          style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}
        >
          <span>© {new Date().getFullYear()} CarbonX Technologies. All rights reserved.</span>
          <div className="flex gap-5">
            {['Privacy Policy', 'Terms of Service', 'Cookie Settings'].map((item) => (
              <a key={item} href="#" className="hover:text-accent transition-colors">
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
