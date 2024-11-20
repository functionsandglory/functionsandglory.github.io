import defaultTheme from 'tailwindcss/defaultTheme';
import * as tailwindcssAnimate from 'tailwindcss-animate';

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
    plugins: [
        tailwindcssAnimate
    ],
};

export default config;