module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/layouts/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    screens: {
      xs: '500px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1440px',
      '3xl': '1780px',
      '4xl': '2160px',
      mq1050: {
        raw: "screen and (max-width: 1050px)",
      },
      mq750: {
        raw: "screen and (max-width: 750px)",
      },
      mq450: {
        raw: "screen and (max-width: 450px)",
      },
    },
    extend: {
      colors: {
        brand: 'rgb(var(--color-brand) / <alpha-value>)',
        body: '#fcfcfc',
        dark: '#0D1321',
        'light-dark': '#171e2e',
        gray: {
          "100": "#222",
          "200": "#050505",
        },
        aquamarine: "#68ffc9",
        "slate-300": "#b3b4b7",
        darkslategray: {
          "100": "#454545",
          "200": "#00505b",
          "300": "#373737",
        },
        teal: "#267582",
        "cobalt-100": "#dfebff",
        white: "#fff",
        gainsboro: {
          "100": "#dfdfdf",
          "200": "#d9d9d9",
        },
        darkgray: "#9f9ea0",
        dimgray: {
          "100": "#6b6b6b",
          "200": "#505050",
        },
        whitesmoke: "#f5f5f5",
        mediumseagreen: "#36cc96",
        black: "#000",
      },
      spacing: {
        13: '3.375rem',
      },
      margin: {
        '1/2': '50%',
      },
      padding: {
        full: '100%',
      },
      width: {
        'calc-320': 'calc(100% - 320px)',
        'calc-358': 'calc(100% - 358px)',
      },
      fontFamily: {
        body: ['Fira Code', 'monospace'],
      },
      fontSize: {
        '13px': ['13px', '18px'],
      },
      borderWidth: {
        3: '3px',
      },
      boxShadow: {
        main: '0px 6px 18px rgba(0, 0, 0, 0.04)',
        light: '0px 4px 4px rgba(0, 0, 0, 0.08)',
        large: '0px 8px 16px rgba(17, 24, 39, 0.1)',
        card: '0px 2px 6px rgba(0, 0, 0, 0.06)',
        transaction: '0px 8px 16px rgba(17, 24, 39, 0.06)',
        button:
          '0px 2px 4px rgba(0, 0, 0, 0.06), 0px 4px 6px rgba(0, 0, 0, 0.1)',
      },
      dropShadow: {
        main: '0px 4px 8px rgba(0, 0, 0, 0.08)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))'
      },
      animation: {
        blink: 'blink 1.4s infinite both;',
        'move-up': 'moveUp 500ms infinite alternate',
        'scale-up': 'scaleUp 500ms infinite alternate',
        'drip-expand': 'expand 500ms ease-in forwards',
        'drip-expand-large': 'expand-large 600ms ease-in forwards',
        'move-up-small': 'moveUpSmall 500ms infinite alternate',
      },
      keyframes: {
        blink: {
          '0%': { opacity: 0.2 },
          '20%': { opacity: 1 },
          '100%': { opacity: 0.2 },
        },
        expand: {
          '0%': {
            opacity: 0,
            transform: 'scale(1)',
          },
          '30%': {
            opacity: 1,
          },
          '80%': {
            opacity: 0.5,
          },
          '100%': {
            transform: 'scale(30)',
            opacity: 0,
          },
        },
        'expand-large': {
          '0%': {
            opacity: 0,
            transform: 'scale(1)',
          },
          '30%': {
            opacity: 1,
          },
          '80%': {
            opacity: 0.5,
          },
          '100%': {
            transform: 'scale(96)',
            opacity: 0,
          },
        },
        moveUp: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-20px)' },
        },
        moveUpSmall: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-10px)' },
        },
        scaleUp: {
          '0%': { transform: 'scale(0)' },
          '100%': { transform: 'scale(1)' },
        },
      },
    },
    fontSize: {
      lg: "18px",
      base: "16px",
      "9xl-4": "28.4px",
      "4xl": "23px",
      sm: "14px",
      "61xl": "80px",
      "5xl": "24px",
      "21xl": "40px",
      "3xs-5": "9.5px",
      inherit: "inherit",
    },
  },
  plugins: [require('@tailwindcss/typography'), require('@tailwindcss/forms')],
};
