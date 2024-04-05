import defaultTheme from 'tailwindcss/defaultTheme';

const config = {
    content: [
        'src/**/*.astro',
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

export default config;