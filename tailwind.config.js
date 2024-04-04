const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
    content: [
        'src/pages/**/*.astro',
    ],
    theme: {
        extend: {
            fontFamily: {
                'sans': ['Noto Sans', ...defaultTheme.fontFamily.sans],
                'fedora': ['SF Fedora'],
            }
        },
    },
};