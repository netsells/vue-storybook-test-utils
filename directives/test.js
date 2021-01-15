export default {
    /**
     * When the directive is inserted, add the attribute only if we're in a test environment.
     *
     * @param {HTMLElement} el
     * @param {object} context
     * @param {string} context.arg
     */
    inserted(el, { arg }) {
        if (!process.env.JEST_WORKER_ID || (typeof window !== 'undefined' && window.STORYBOOK_ENV)) {
            return;
        }

        // Add the `data-testid` attribute for our tests
        el.setAttribute('data-testid', arg);
    },
};
