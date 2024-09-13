import Link from 'next/link';
import { Input } from './input';
import { Button } from './button';

import { ReactNode } from 'react';

interface NavLinkProps {
  href: string;
  children: ReactNode;
}

const NavLink = ({ href, children }: NavLinkProps) => (
  <Link href={href} className="text-sm hover:underline">
    {children}
  </Link>
);

const NewsletterForm = () => (
  <div className="mt-4 md:mt-0">
    <h3 className="text-lg font-semibold mb-2">Subscribe to Our Newsletter</h3>
    <form className="flex">
      <Input
        type="email"
        placeholder="Enter your email"
        className="w-full max-w-xs mr-2 text-purple-800"
      />
      <Button type="submit" className="bg-white text-purple-800 hover:bg-purple-100">
        Subscribe
      </Button>
    </form>
  </div>
);

const Footer = () => (
  <footer>
    <div className="container mx-auto py-4 px-5 flex flex-col md:flex-row items-center justify-between">
      <p className="text-sm">
        © 2023 LightNovelHub. All rights reserved.
      </p>
      <nav className="flex justify-center md:justify-end space-x-4">
        <NavLink href="/about">About Us</NavLink>
        <NavLink href="/terms">Terms</NavLink>
        <NavLink href="/privacy">Privacy</NavLink>
        <NavLink href="/contact">Contact</NavLink>
      </nav>
      <NewsletterForm />
    </div>
  </footer>
);

export default Footer;