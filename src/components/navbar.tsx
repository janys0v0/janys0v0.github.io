'use client';

import Link from 'next/link';

export function NavBar() {
  return (
    <nav className="bg-black p-4 relative z-10">
      <div className="max-w-7xl mx-auto flex justify-center space-x-8">
      <Link 
          href="/"
          className="text-white hover:text-gray-300 transition-colors"
        >
          Home
        </Link>
        <Link 
          href="about"
          className="text-white hover:text-gray-300 transition-colors"
        >
          About
        </Link>
        <Link 
          href="/resume"
          className="text-white hover:text-gray-300 transition-colors"
        >
          Resume
        </Link>
        <Link 
          href="/projects"
          className="text-white hover:text-gray-300 transition-colors"
        >

          Projects
        </Link>
        <Link 
          href="/#get_in_touch"
          className="text-white hover:text-gray-300 transition-colors"
        >
          Get In Touch
        </Link>
      </div>
    </nav>
  );
}
