const mergeWith = require('lodash.mergewith');

const mergeStrategy = (...objects) => mergeWith({}, ...objects, (objValue, srcValue) => {
    if (Array.isArray(objValue)) {
        return srcValue;
    }
});

const mergeStoryData = (suite, story) => {
    const args = mergeStrategy(suite.default.args, story.args);
    const argTypes = mergeStrategy(suite.default.argTypes, story.argTypes);
    const parameters = mergeStrategy(suite.default.parameters, story.parameters);

    return { args, argTypes, parameters };
};

module.exports = mergeStoryData;
