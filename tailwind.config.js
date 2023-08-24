const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
    content: [
        'index.html'
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