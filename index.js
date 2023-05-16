import {
    config as globalConfig,
    createWrapperError,
} from '@vue/test-utils';
import SuiteFactory from './lib/SuiteFactory';
import { RouterLink } from 'vue-router';
import merge from 'lodash.merge';

let routerConfig;

/**
 * Wait for any animations to complete.
 *
 * @returns {Promise<unknown>}
 */
export const waitForAnimationFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

/**
 * Set global stubs within the test utils package.
 *
 * @param {object} stubs
 *
 * @returns {object}
 */
export const setStubs = (stubs = {}) => {
    merge(globalConfig.global.stubs, stubs);
};

/**
 * Set global mocks within the test utils package.
 *
 * @param {object} mocks
 *
 * @returns {object}
 */
export const setMocks = (mocks = {}) => {
    merge(globalConfig.global.mocks, mocks);
};

/**
 * Mock vue directives.
 *
 * @param {object} directives
 */
export const mockDirectives = (directives = {}) => {
    Object.entries(directives).forEach(([name, value]) => {
        globalConfig.global.directives[name] = value;
    });
};

/**
 * Mock vue components.
 *
 * @param {object} components
 */
export const mockComponents = (components = {}) => {
    Object.entries(components).forEach(([name, value]) => {
        globalConfig.global.stubs[name] = value;
    });
};

///**
// * Setup Vue plugins
// *
// * @param {Array} plugins
// */
//const setupPlugins = (plugins = []) => plugins.forEach((plugin) => Vue.use(plugin));
//
///**
// * Mock the vuex store.
// *
// * @param {object} config
// */
//const mockStore = (config = {}) => {
//    const Vuex = require('vuex');
//
//    setupPlugins([Vuex]);
//
//    store = () => new Vuex.Store(config);
//};

/**
 * Mock a vue router instance.
 *
 * @param {object} config
 */
export const mockRouter = (config = {}) => {
    routerConfig = config;

    mockComponents({
        NuxtLink: {
            ...RouterLink,

            name: 'nuxt-link',
        },
    });
};

/**
 * Generate the test suite for a story suite.
 *
 * @param {object} suite
 *
 * @returns {{}}
 */
export const generateSuite = (suite) => {
    globalConfig.plugins.VueWrapper.install((wrapper) => {
        wrapper.getComponent = function() {
            return this.findComponent(suite.default.component);
        };
    });

    const suiteFactory = new SuiteFactory(suite);

    if (routerConfig) {
        suiteFactory
            .mockRouter()
            .setRouterConfig(routerConfig);
    }

    return suiteFactory.generateSuite();
};

/**
 * Extend the vue test utils wrapper with additional functionality.
 */
const extendWrapper = () => {
    addTestIdHelpers();
};

/**
 * Add the wrapper util helpers for selecting via testId.
 */
const addTestIdHelpers = () => {
    const selector = (id) => `[data-testid="${ id }"]`;

    globalConfig.plugins.VueWrapper.install((wrapper) => {
        wrapper.findByTestId = function(id) {
            return this.find(selector(id));
        };

        wrapper.findAllByTestId = function(id) {
            return this.findAll(selector(id));
        };

        wrapper.findComponentByTestId = function(component, id) {
            return this.findAllComponents(component)
                ?.find((w) => w.attributes('data-testid') === id)
                || createWrapperError('DOMWrapper');
        };

        wrapper.findAllComponentsByTestId = function(component, id) {
            return wrapper.findAllComponents(component)
                ?.filter((w) => w.attributes('data-testid') === id);
        };
    });
};

extendWrapper();
