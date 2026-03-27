import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiMenu, FiX, FiUser } from "react-icons/fi";
import { useAuth } from "../../context/useAuth";
import { LANDING_NAV_ITEMS } from "../../data/landing";
import type { NavbarProps } from "../../types/landing";

const Navbar: React.FC<NavbarProps> = ({ onLogin, onSignup }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
          scrolled || menuOpen
            ? "bg-white/80 backdrop-blur-md border-b border-gray-200/60 shadow-sm"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="max-w-360 mx-auto md:py-10 h-20 px-8 flex items-center justify-between">
          {/* Logo */}
         <div className="h-24 flex items-center">
                    <Link
                        to="/"
                        aria-label="ResumeeNow home"
                        className="flex items-center gap-3 cursor-pointer group opacity-90 hover:opacity-100 transition-opacity" 
                    >
                         <img
                            src="/resumeenowlogo.png"
                            alt="ResumeeNow logo"
                            className="h-6 w-6 object-contain grayscale group-hover:grayscale-0 transition-all duration-500"
                        />
                        <span className="text-lg font-medium tracking-tight text-black/90">
                           Resumee<span className="text-zinc-500">Now.</span>
                        </span>
                    </Link>
                </div>


          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {LANDING_NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-gray-600 hover:text-black transition-colors px-3 py-2 rounded-lg hover:bg-gray-50/50"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Desktop Auth/User Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium">
                  <FiUser className="text-gray-400" />
                  <span className="truncate max-w-30">{user.email}</span>
                </div>
                <button
                  onClick={signOut}
                  className="text-sm font-medium text-gray-700 hover:text-black transition-colors cursor-pointer"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onLogin}
                  className="text-sm font-medium text-gray-700 hover:text-black transition-colors cursor-pointer "
                >
                  Log In
                </button>
                <button
                  onClick={onSignup}
                  className="group flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 cursor-pointer rounded-full text-sm font-medium hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  Get Started
                  <div className="group-hover:translate-x-1 transition-transform" />
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-700 focus:outline-none p-2 "
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        <div
          className={`md:hidden absolute top-20 left-0 w-full bg-white border-b border-gray-100 shadow-xl overflow-hidden transition-all duration-300 ease-in-out ${
            menuOpen ? "max-h-100 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="flex flex-col p-6 space-y-4">
            {LANDING_NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-lg font-medium text-gray-800 hover:text-blue-600 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <div className="h-px bg-gray-100 my-2"></div>
            {user ? (
              <>
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium">
                  <FiUser className="text-gray-400" />
                  <span className="truncate max-w-30">{user.email}</span>
                </div>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    signOut();
                  }}
                  className="text-lg font-medium text-gray-600 hover:text-blue-600 text-left"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onLogin();
                  }}
                  className="text-lg font-medium text-gray-600 hover:text-blue-600 text-left cursor-pointer"
                >
                  Log In
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onSignup();
                  }}
                  className="text-center bg-black text-white py-3 rounded-xl font-medium shadow-md transition cursor-pointer"
                >
                  Get Started Free
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Blurry overlay when menu is open */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-all duration-300"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default Navbar;
