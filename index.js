const { render: rawRender } = require('@vue/server-test-utils');
const { mount: rawMount, shallowMount: rawShallowMount, createLocalVue, config, ...rest } = require('@vue/test-utils');
const Vue = require('vue');
const Vuex = require('vuex');
const VueRouter = require('vue-router');
const merge = require('lodash.merge');

let store;
let routerConfig;

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
    argTypes: {
        ...story.argTypes,
        ...story.args,
    },
});

/**
 * Generate the config for the mounting methods.
 *
 * @param {object} config
 *
 * @returns {object}
 */
const generateConfig = ({ localVue, ...config }) => merge({
    stubs: {
        icon: true,
        'nuxt-link': true,
    },
    store,
    localVue: makeLocalVue(localVue),
}, config);

/**
 * Generate the config for the story mounting methods.
 *
 * @param {object} story
 * @param {object} options
 *
 * @returns {object}
 */
const generateConfigForStory = (story, { localVue, ...options }) => {
    const config = {
        propsData: {
            ...story.args,
            ...options.propsData,
        },
        localVue: makeLocalVue(localVue),
    };

    if (
        !options.router
        && story.parameters
        && story.parameters.router
        && story.parameters.router.routes
    ) {
        config.router = createRouter();

        config.router.addRoutes(story.parameters.router.routes);
        config.stubs = {
            ...config.stubs,
            'nuxt-link': false,
        };
    }

    return merge(generateConfig(options), config);
};

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
    const wrapper = rawMount(generateStory(story), generateConfigForStory(story, config));

    return extendWrapper(wrapper);
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
    const wrapper = rawShallowMount(generateStory(story), generateConfigForStory(story, config));

    return extendWrapper(wrapper);
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

    store = new Vuex.Store(config);
};

/**
 * Mock a vue router instance.
 *
 * @param {object} config
 */
const mockRouter = (config = {}) => {
    setupPlugins([VueRouter]);

    routerConfig = {
        mode: 'history',
        base: decodeURI('/'),
        linkActiveClass: 'nuxt-link-active',
        linkExactActiveClass: 'nuxt-link-exact-active',
        ...config
    };
};

/**
 * Create a router instance.
 *
 * @returns {object}
 */
const createRouter = () => {
    return new VueRouter(routerConfig);
}

/**
 * Generate the test factory for the suite component.
 *
 * @param {object} suite
 *
 * @returns {function(*=): Promise<Cheerio>}
 */
const generateComponentFactory = (suite) => {
    const defaultFactoryConfig = {
        propsData: suite.default.args || {},
    };

    const defaultFactory = (config = {}) => mount(suite.default.component, merge({}, defaultFactoryConfig, config));

    defaultFactory.mount = defaultFactory.bind({});
    defaultFactory.shallowMount = (config = {}) => shallowMount(suite.default.component, merge({}, defaultFactoryConfig, config));
    defaultFactory.render = (config = {}) => render(suite.default.component, merge({}, defaultFactoryConfig, config));

    return defaultFactory;
}

/**
 * Generate a testing factory for a single story.
 *
 * @param {object} suite
 * @param {function} story
 *
 * @returns {function}
 */
const generateStoryFactory = (suite, story) => {
    story.args = merge({}, suite.default.args, story.args);
    story.argTypes = merge({}, suite.default.argTypes, story.argTypes);
    story.parameters = merge({}, suite.default.parameters, story.parameters);

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

    suiteObject.utils = {
        component: suite.default.component,
        defaultExport: suite.default,
    };

    suiteObject.component = generateComponentFactory(suite);

    Object.entries(suite)
        .filter(([name]) => name !== 'default')
        .forEach(([name, story]) => {
            suiteObject[name] = generateStoryFactory(suite, story);
        });

    return suiteObject;
};

/**
 * Extend the vue test utils wrapper with additional functionality.
 *
 * @param {object} wrapper
 */
const extendWrapper = (wrapper) => {
    addTestIdHelpers(wrapper);

    return wrapper;
};

/**
 * Add the wrapper util helpers for selecting via testId.
 *
 * @param {object} wrapper
 */
const addTestIdHelpers = (wrapper) => {
    const selector = (id) => `[data-testid="${ id }"]`;

    wrapper.findByTestId = function(id) {
        return this.find(selector(id));
    };

    wrapper.findAllByTestId = function(id) {
        return this.findAll(selector(id));
    };
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
    mockRouter,
    setupPlugins,
    rawMount,
    rawRender,
    rawShallowMount,
    config,
    ...rest,
};
