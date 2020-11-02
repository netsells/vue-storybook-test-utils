const { render: rawRender } = require('@vue/server-test-utils');
const { mount: rawMount, shallowMount: rawShallowMount, createLocalVue, config, ...rest } = require('@vue/test-utils');
const Vue = require('vue');
const Vuex = require('vuex');
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
    return rawRender(generateStory(story), generateConfigForStory(story, config));
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
    return rawMount(generateStory(story), generateConfigForStory(story, config));
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
    return rawShallowMount(generateStory(story), generateConfigForStory(story, config));
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
    return rawRender(component, generateConfig(config));
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
    return rawMount(component, generateConfig(config));
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
    return rawShallowMount(component, generateConfig(config));
};

/**
 * Wait for any animations to complete.
 *
 * @returns {Promise<unknown>}
 */
const waitForAnimationFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

/**
 * Set global stubs within the test utils package.
 *
 * @param {object} stubs
 *
 * @returns {object}
 */
const setStubs = (stubs = {}) => merge(config.stubs, stubs);

/**
 * Set global mocks within the test utils package.
 *
 * @param {object} mocks
 *
 * @returns {object}
 */
const setMocks = (mocks = {}) => merge(config.mocks, mocks);

/**
 * Mock vue directives.
 *
 * @param {object} directives
 */
const mockDirectives = (directives = {}) => {
    Object.entries(directives).forEach(([name, value]) => {
        Vue.directive(name, value === true ? {} : value);
    });
};

/**
 * Mock vue components.
 *
 * @param {object} components
 */
const mockComponents = (components = {}) => {
    Object.entries(components).forEach(([name, value]) => {
        Vue.component(name, value === true ? {} : value);
    });
};

/**
 * Setup Vue plugins
 *
 * @param {Array} plugins
 */
const setupPlugins = (plugins = []) => plugins.forEach((plugin) => Vue.use(plugin));

/**
 * Mock the vuex store.
 *
 * @param {object} config
 */
const mockStore = (config = {}) => {
    setupPlugins([Vuex]);

    const store = new Vuex.Store(config);

    Vue.mixin({ store });
};

/**
 * Generate a testing factory for a single story.
 *
 * @param {object} suite
 * @param {object} story
 *
 * @returns {function}
 */
const generateStoryFactory = (suite, story) => {
    story.args = merge({}, suite.default.args, story.args);
    story.argTypes = merge({}, suite.default.argTypes, story.argTypes);

    const storyFactory = (config = {}) => mountStory(story, config);

    storyFactory.mountStory = storyFactory.bind({});
    storyFactory.renderStory = (config = {}) => renderStory(story, config);
    storyFactory.shallowMountStory = (config = {}) => renderStory(story, config);
    storyFactory.story = story;

    return storyFactory;
}

/**
 * Generate the test suite for a story suite.
 *
 * @param {object} suite
 *
 * @returns {{}}
 */
const generateSuite = (suite) => {
    const suiteObject = {};

    const defaultFactory = (config = {}) => mount(suite.default.component, merge({
        propsData: suite.default.args || {},
    }, config));

    defaultFactory.mount = defaultFactory.bind({});
    suiteObject.component = defaultFactory;

    Object.entries(suite)
        .filter(([name]) => name !== 'default')
        .forEach(([name, story]) => {
            suiteObject[name] = generateStoryFactory(suite, story);
        });

    return suiteObject;
};

module.exports = {
    generateSuite,
    renderStory,
    mountStory,
    shallowMountStory,
    render,
    mount,
    shallowMount,
    waitForAnimationFrame,
    setStubs,
    setMocks,
    mockDirectives,
    mockComponents,
    mockStore,
    setupPlugins,
    rawMount,
    rawRender,
    rawShallowMount,
    config,
    ...rest,
};
