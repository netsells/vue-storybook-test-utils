export default {
    /**
     * When the directive is inserted, add the attribute only if we're in a test environment.
     *
     * @param {HTMLElement} el
     * @param {object} context
     * @param {string} context.arg
     */
    created(el, { arg }) {
        // if (typeof process === 'undefined' || !process.env.VITEST || (typeof window !== 'undefined' && window.STORYBOOK_ENV)) {
        //     return;
        // }

        // Add the `data-testid` attribute for our tests
        el.setAttribute('data-testid', arg);
    },
};
