/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: `var(--radius)`,
        md: `calc(var(--radius) - 2px)`,
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        primary: "#E30613", // Rojo de ofertas
        secondary: "#002147", // Azul oscuro para nav
        accent: "#F5F5F5", // Gris claro fondos
        textDark: "#333333", // Texto principal
        textLight: "#FFFFFF", // Texto en botones oscuros
        highlight: "#FFD200", // Amarillo de énfasis
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
