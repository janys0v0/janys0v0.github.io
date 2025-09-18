import Link from 'next/link';

interface NavbarItemProps {
  href: string;
  children: React.ReactNode;
}

export function NavbarItem({ href, children }: NavbarItemProps) {
  return (
    <div className="navbar-item-container">
      <div className="navbar-item-content">
        <span className="navbar-item-text">{children}</span>
        <div className="navbar-item-glow" />
      </div>
      <Link 
        href={href} 
        className="absolute inset-0 z-20 flex items-center justify-end px-8"
      />
    </div>
  );
} 