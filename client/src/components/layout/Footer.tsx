import { Link } from 'react-router-dom';
import { Instagram, Twitter, Facebook, Mail, Phone, MapPin } from 'lucide-react';

const footerLinks = {
  Discover: [
    { label: 'Restaurants', href: '/restaurants' },
    { label: 'Reserve a Table', href: '/reservation' },
    { label: 'Order Online', href: '/restaurants' },
    { label: 'Loyalty Program', href: '/profile?tab=loyalty' },
  ],
  Company: [
    { label: 'About Savora', href: '#' },
    { label: 'Partner With Us', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Press', href: '#' },
  ],
  Support: [
    { label: 'Help Center', href: '#' },
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Cookie Settings', href: '#' },
  ],
};

export function Footer() {
  return (
    <footer className="bg-primary text-cream/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="font-heading text-3xl text-cream block mb-3">
              Savora
            </Link>
            <p className="text-sm font-body text-cream/40 leading-relaxed max-w-xs mb-6">
              Curating extraordinary dining experiences across India's finest restaurants.
            </p>
            <div className="flex items-center gap-3">
              {[Instagram, Twitter, Facebook].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-full border border-cream/10 flex items-center justify-center text-cream/40 hover:text-gold hover:border-gold/30 transition-colors"
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <h4 className="font-body text-xs font-semibold uppercase tracking-widest text-cream/30 mb-4">
                {group}
              </h4>
              <ul className="space-y-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      to={href}
                      className="font-body text-sm text-cream/50 hover:text-gold transition-colors duration-200"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact strip */}
        <div className="flex flex-wrap gap-6 pb-8 border-b border-cream/[0.07]">
          {[
            { icon: Phone, text: '+91 80 4567 8901' },
            { icon: Mail, text: 'hello@savora.in' },
            { icon: MapPin, text: 'Indiranagar, Bengaluru' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-sm font-body text-cream/40">
              <Icon size={13} className="text-gold/50" />
              {text}
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6">
          <p className="font-body text-xs text-cream/25">
            © {new Date().getFullYear()} Savora Technologies Pvt. Ltd. All rights reserved.
          </p>
          <p className="font-body text-xs text-cream/20">
            Crafted with care in Bengaluru, India
          </p>
        </div>
      </div>
    </footer>
  );
}
