/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./views/**/*.{js,jsx,ts,tsx}",
    "./*.{js,jsx,ts,tsx}", // <--- QUAN TRỌNG: Dòng này để quét file App.tsx ở bên ngoài
  ],
  theme: {
    extend: {
      fontFamily: {
        syne: ["Syne", "sans-serif"],
        space: ['"Space Grotesk"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
