// Font loaders for Next.js using next/font/local
// Only the weights actually used in the theme are included

import localFont from 'next/font/local';

export const montserrat = localFont({
  src: [
    { path: '../../public/fonts/montserrat/Montserrat-Regular.ttf', weight: '400', style: 'normal' },
    { path: '../../public/fonts/montserrat/Montserrat-Medium.ttf', weight: '500', style: 'normal' },
    { path: '../../public/fonts/montserrat/Montserrat-SemiBold.ttf', weight: '600', style: 'normal' },
    { path: '../../public/fonts/montserrat/Montserrat-Bold.ttf', weight: '700', style: 'normal' },
  ],
  variable: '--font-montserrat',
  display: 'swap',
});

export const lexend = localFont({
  src: [
    { path: '../../public/fonts/lexend/Lexend-Regular.ttf', weight: '400', style: 'normal' },
    { path: '../../public/fonts/lexend/Lexend-Medium.ttf', weight: '500', style: 'normal' },
    { path: '../../public/fonts/lexend/Lexend-SemiBold.ttf', weight: '600', style: 'normal' },
    { path: '../../public/fonts/lexend/Lexend-Bold.ttf', weight: '700', style: 'normal' },
  ],
  variable: '--font-lexend',
  display: 'swap',
});

export const castoro = localFont({
  src: [
    { path: '../../public/fonts/castoro/Castoro-Regular.ttf', weight: '400', style: 'normal' },
    { path: '../../public/fonts/castoro/Castoro-Italic.ttf', weight: '400', style: 'italic' },
  ],
  variable: '--font-castoro',
  display: 'swap',
});

// CSS Variables to use in globals.css:
// --font-sans: var(--font-lexend);
// --font-display: var(--font-castoro);
// --font-mono: var(--font-montserrat);