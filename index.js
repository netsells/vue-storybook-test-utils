const { render: vRender } = require('@vue/server-test-utils');
const { mount: vMount, shallowMount: vShallowMount, createLocalVue } = require('@vue/test-utils');
const merge = require('lodash.merge');

/**
 * Generate a local vue instance for testing environment.
 *
 * @param {Function} callback
 *
 * @returns {VueConstructor<Vue>}
 */
const makeLocalVue = (callback = undefined) => {
    const localVue = createLocalVue();

    if (callback && typeof callback === 'function') {
        callback(localVue);
    }

    return localVue;
};

/**
 * Generate a vue component from a story.
 *
 * @param {Function} story
 *
 * @returns {object}
 */
const generateStory = (story) => story(story.args, {
    argTypes: story.args,
});

/**
 * Generate the config for the mounting methods.
 *
 * @param {object} config
 *
 * @returns {object}
 */
const generateConfig = (config) => merge({
    stubs: {
        icon: true,
        'nuxt-link': true,
    },
    localVue: makeLocalVue(),
}, config);

/**
 * Generate the config for the story mounting methods.
 *
 * @param {object} story
 * @param {object} options
 *
 * @returns {object}
 */
const generateConfigForStory = (story, options) => merge(generateConfig(options), {
    propsData: {
        ...story.args,
        ...options.propsData,
    },
    localVue: makeLocalVue(options.localVue),
});

/**
 * Render a story using `@vue/server-test-utils`.
 *
 * @param {Function} story
 * @param {object} config
 *
 * @returns {Promise<Cheerio>}
 */
const renderStory = (story, config = {}) => {
    return vRender(generateStory(story), generateConfigForStory(story, config));
};

/**
 * Mount a story using `@vue/test-utils`.
 *
 * @param {Function} story
 * @param {object} config
 *
 * @returns {Promise<Cheerio>}
 */
const mountStory = (story, config = {}) => {
    return vMount(generateStory(story), generateConfigForStory(story, config));
};

/**
 * Shallow mount a story using `@vue/test-utils`.
 *
 * @param {Function} story
 * @param {object} config
 * @param {object} config.propsData
 * @param {object} config.options
 *
 * @returns {Promise<Cheerio>}
 */
const shallowMountStory = (story, config = {}) => {
    return vShallowMount(generateStory(story), generateConfigForStory(story, config));
};

/**
 * Render a component using `@vue/server-test-utils`.
 *
 * @param {object} component
 * @param {object} config
 *
 * @returns {Promise<Cheerio>}
 */
const render = (component, config = {}) => {
    return vRender(component, generateConfig(config));
};

/**
 * Mount a component using `@vue/test-utils`.
 *
 * @param {object} component
 * @param {object} config
 *
 * @returns {Promise<Cheerio>}
 */
const mount = (component, config = {}) => {
    return vMount(component, generateConfig(config));
};

/**
 * Shallow mount a component using `@vue/test-utils`.
 *
 * @param {object} component
 * @param {object} config
 *
 * @returns {Promise<Cheerio>}
 */
const shallowMount = (component, config = {}) => {
    return vShallowMount(component, generateConfig(config));
};

module.exports = {
    generateStory,
    renderStory,
    mountStory,
    shallowMountStory,
    render,
    mount,
    shallowMount,
};
