import type { LandingTrustedLogo } from '../../types/landing';

export const LANDING_TRUSTED_LOGOS: LandingTrustedLogo[] = [
  {
    name: "TechCrunch",
    svg: (
      <svg viewBox="0 0 200 40" className="h-6 md:h-8 w-auto" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M25.4,14.6H16.2V32H8.8V14.6H0V8h25.4V14.6z M48.2,25.8h-15v-4.8h13.8v-6.2H33.2V10h14.6V3.8H24.8v28.2h23.4V25.8z M72.8,10.4c-1.8-1.8-4.4-2.8-7.4-2.8c-6.6,0-11.4,5.2-11.4,12.2c0,7.2,4.8,12.4,11.4,12.4c3.2,0,5.8-1,7.6-3l-4.4-5.4 c-1,1-2,1.6-3.4,1.6c-2.6,0-4.2-2-4.2-5.4c0-3.4,1.6-5.4,4.2-5.4c1.4,0,2.4,0.6,3.4,1.6L72.8,10.4z M98.4,32V3.8h-8.4v11.6H78.6 V3.8h-8.4V32h8.4V22.2h11.4V32H98.4z" />
        <rect x="102" y="3.8" width="8.4" height="28.2" />
        <path d="M138.6,10.4c-1.8-1.8-4.4-2.8-7.4-2.8c-6.6,0-11.4,5.2-11.4,12.2c0,7.2,4.8,12.4,11.4,12.4c3.2,0,5.8-1,7.6-3l-4.4-5.4 c-1,1-2,1.6-3.4,1.6c-2.6,0-4.2-2-4.2-5.4c0-3.4,1.6-5.4,4.2-5.4c1.4,0,2.4,0.6,3.4,1.6L138.6,10.4z" />
        <path d="M164.2,32V15.6c0-3.6-1.8-5.6-5.2-5.6c-2.6,0-4.6,1.4-5.8,3.6V3.8h-8.4V32h8.4V19.4c0-2,1.2-3.2,2.8-3.2 c1.4,0,2.2,1,2.2,2.8V32H164.2z" />
      </svg>
    )
  },
  {
    name: "Product Hunt",
    svg: (
      <svg viewBox="0 0 200 40" className="h-7 md:h-9 w-auto" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M20,0C8.954,0,0,8.954,0,20s8.954,20,20,20s20-8.954,20-20S31.046,0,20,0z M26.34,20.881 c-0.89,0.89-2.14,1.335-3.75,1.335h-4.18v6.27h-4.18V11.526h8.36c1.61,0,2.86,0.445,3.75,1.335c0.89,0.89,1.335,2.14,1.335,3.75 C27.675,18.221,27.23,19.991,26.34,20.881z M22.16,18.656c0.445-0.445,0.668-1.068,0.668-1.87c0-0.802-0.223-1.425-0.668-1.87 c-0.445-0.445-1.068-0.668-1.87-0.668h-1.87v5.076h1.87C21.092,19.324,21.715,19.101,22.16,18.656z" />
        <text x="50" y="26" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="22" letterSpacing="-0.5">Product Hunt</text>
      </svg>
    )
  },
  {
    name: "Forbes",
    svg: (
      <svg viewBox="0 0 120 40" className="h-5 md:h-7 w-auto" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <text x="0" y="30" fontFamily="Georgia, serif" fontWeight="bold" fontSize="28" letterSpacing="1">Forbes</text>
      </svg>
    )
  },
  {
    name: "Wired",
    svg: (
      <svg viewBox="0 0 120 40" className="h-4 md:h-5 w-auto" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <text x="0" y="30" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="26" letterSpacing="2">WIRED</text>
      </svg>
    )
  }
];
