export function getScrollContainer() {
    return document.getElementById('scroll-container');
}

export function easeIn(value: number) {
   return Math.pow(value, 3)
}