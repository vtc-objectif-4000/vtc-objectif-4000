import forms from "@tailwindcss/forms";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        sand: {
          50: "#fbf8f3",
          100: "#f3ece2",
          200: "#e7d6c4",
        },
        pine: {
          50: "#eef6f4",
          100: "#d3e9e4",
          300: "#6aa79b",
          500: "#2d7a6e",
          700: "#205b53",
          900: "#123a35",
        },
        coral: {
          100: "#f9dfd6",
          300: "#ef9c7d",
          500: "#dd6d45",
        },
        slategreen: "#4f6b66",
      },
      fontFamily: {
        sans: ["Manrope", "system-ui", "sans-serif"],
        serif: ["Fraunces", "Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 20px 60px rgba(18, 58, 53, 0.10)",
        float: "0 24px 80px rgba(18, 58, 53, 0.14)",
      },
      backgroundImage: {
        "brand-glow":
          "radial-gradient(circle at top left, rgba(45,122,110,0.18), transparent 34%), radial-gradient(circle at bottom right, rgba(221,109,69,0.18), transparent 26%)",
      },
    },
  },
  plugins: [forms],
};
