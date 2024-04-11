import {SECTION_TITLE_HEADER_OFFSET} from './constants';

export function getScrollContainer() {
    return document.getElementById('scroll-container');
}

export function easeIn(value: number) {
    return Math.pow(value, 3)
}

export function scrollToSection(scrollContainer: HTMLElement, targetElement: HTMLElement) {
    const targetTop = Math.ceil(scrollContainer.scrollTop + (targetElement.getBoundingClientRect().y - SECTION_TITLE_HEADER_OFFSET));
    scrollContainer.scrollTo({
        top: targetTop,
        behavior: 'smooth'
    });
}