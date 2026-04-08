import Link from 'next/link';
import { MapPin, Phone, Mail, Clock, Facebook, Instagram } from 'lucide-react';

const footerLinks = {
  shop: [
    { name: 'All Products', href: '/shop' },
    { name: 'Formal Shoes', href: '/shop/formal-shoes' },
    { name: 'Casual Shoes', href: '/shop/casual-shoes' },
    { name: 'Boots', href: '/shop/boots' },
    { name: 'Khussas', href: '/shop/khussas' },
    { name: 'New Arrivals', href: '/shop?filter=new' },
    { name: 'Sale', href: '/shop?filter=sale' },
  ],
  customerService: [
    { name: 'Contact Us', href: '/contact' },
    { name: 'Track Order', href: '/track-order' },
    { name: 'Shipping Policy', href: '/shipping' },
    { name: 'Returns & Exchanges', href: '/returns' },
    { name: 'Size Guide', href: '/size-guide' },
    { name: 'FAQs', href: '/faqs' },
  ],
  company: [
    { name: 'About Us', href: '/about' },
    { name: 'Our Craftsmanship', href: '/craftsmanship' },
    { name: 'Store Locations', href: '/stores' },
    { name: 'Careers', href: '/careers' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
  ],
};

const stores = [
  {
    name: 'Executive Mochi | Service Super Shoes',
    address: '842X+W5Q, GT Road Ghakhar, Pakistan',
    phone: '+92 300 6314988',
    hours: 'Mon-Sat: 10am - 9pm',
  },
  {
    name: 'Executive Mochi Pasrur',
    address: 'Main Bazar, Pasrur',
    phone: '+92 300 7654321',
    hours: 'Mon-Sat: 10am - 9pm',
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-sidebar text-sidebar-foreground">
      {/* Newsletter Section */}
      <div className="border-b border-sidebar-border">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="font-serif text-2xl sm:text-3xl font-semibold mb-3">
              Join the Executive Circle
            </h3>
            <p className="text-sidebar-foreground/70 mb-6">
              Subscribe for exclusive offers, new arrivals, and style inspiration delivered to your inbox.
            </p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-sidebar-accent border border-sidebar-border rounded-lg text-sidebar-foreground placeholder:text-sidebar-foreground/50 focus:outline-none focus:ring-2 focus:ring-sidebar-ring"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-sidebar-primary text-sidebar-primary-foreground font-medium rounded-lg hover:bg-sidebar-primary/90 transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block">
              <span className="font-serif text-2xl font-semibold tracking-tight">
                Executive Mochi
              </span>
            </Link>
            <p className="mt-4 text-sidebar-foreground/70 max-w-sm leading-relaxed">
              Crafting luxury footwear since 1985. Each pair tells a story of heritage, 
              craftsmanship, and timeless elegance from the heart of Pakistan.
            </p>
            <div className="mt-6 flex items-center gap-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-sidebar-accent hover:bg-sidebar-accent/80 transition-colors"
              >
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-sidebar-accent hover:bg-sidebar-accent/80 transition-colors"
              >
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </a>
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4">Shop</h4>
            <ul className="space-y-3">
              {footerLinks.shop.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service Links */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4">Help</h4>
            <ul className="space-y-3">
              {footerLinks.customerService.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Store Locations */}
        <div className="mt-12 pt-8 border-t border-sidebar-border">
          <h4 className="font-semibold text-sm uppercase tracking-wider mb-6">Visit Our Stores</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {stores.map((store) => (
              <div key={store.name} className="flex gap-4">
                <div className="p-2 h-fit rounded-lg bg-sidebar-accent">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h5 className="font-medium">{store.name}</h5>
                  <p className="text-sidebar-foreground/70 text-sm mt-1">{store.address}</p>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-sidebar-foreground/70">
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      {store.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {store.hours}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-sidebar-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-sidebar-foreground/60">
            <p>&copy; {new Date().getFullYear()} Executive Mochi. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                info@executivemochi.pk
              </span>
              <span className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                +92 300 6314988
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
