/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        nhs: {
          blue: '#005EB8',
          darkBlue: '#002F6C',
          brightBlue: '#00A4E4',
          lightBlue: '#E8EDF8',
          green: '#009639',
          lightGreen: '#EAF6EC',
          grey: '#768692',
          lightGrey: '#F0F4F5',
          emergencyRed: '#DA291C'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
