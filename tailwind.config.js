/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#197fe6", // Xanh Vibrant
                charcoal: "#0A0A0A", // Than đậm
                white: "#FFFFFF",
            },
            fontFamily: {
                sans: ['"Be Vietnam Pro"', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
