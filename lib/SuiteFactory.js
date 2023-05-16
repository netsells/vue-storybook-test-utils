import mergeWith from 'lodash.mergewith';
import StoryFactory from './StoryFactory';

const mergeStrategy = (...objects) => mergeWith({}, ...objects, (objValue, srcValue) => {
    if (Array.isArray(objValue)) {
        return srcValue;
    }
});

class SuiteFactory {
    constructor(suite) {
        this.suite = suite;
        this.shouldMockRouter = false;
        this.routerConfig = {};
    }

    mockRouter() {
        this.shouldMockRouter = true;

        return this;
    }

    setRouterConfig(config) {
        this.routerConfig = config;

        return this;
    }

    generateSuite() {
        const { default: defaultStory } = this.suite;

        const suiteObject = Object.entries(this.suite)
            .filter(([name]) => name !== 'default')
            .reduce((suite, [name, story]) => ({
                ...suite,
                [name]: (config = {}) => {
                    const mergedStory = typeof story === 'function'
                        ? story
                        : mergeStrategy(this.suite.default, story);
                    const props = mergeStrategy(this.suite.default.args, story.args, config.props);
                    const parameters = mergeStrategy(this.suite.default.parameters, story.parameters);
                    const routerConfig = mergeStrategy(parameters.router || {}, this.routerConfig);

                    const storyFactory = new StoryFactory(mergedStory);

                    if (this.shouldMockRouter) {
                        storyFactory.mockRouter(routerConfig);
                    }

                    return storyFactory.mountStory({
                        ...config,
                        props,
                    });
                },
            }), {});

        suiteObject.utils = {
            component: this.suite.default.component,
        };

        return suiteObject;
    }
}

export default SuiteFactory;
