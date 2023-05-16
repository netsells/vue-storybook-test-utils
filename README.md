# @netsells/vue-storybook-test-utils

This package provides wrappers around `@vue/test-utils` for easier integration with storybook-based tests.

Note: This package works with the following stack:
- Nuxt 3
- Vite
- `@vue/test-utils`
- Vitest
- Storybook 7+

For Nuxt 2 compatability see versions `1.x`.

## Why?

Most of your test composition and variants (e.g. props, slots) is already setup as part of storybook for use in component-first development and Visual Regression Testing process. It makes little sense to do this setup twice. This module allows you to pass your stories directly to the `@vue/test-utils` package and have the wrappers automatically generated with your provided props and story markup.

Note: Version `1.x` of this package works with the following stack:

- Nuxt 2
- Storybook 6
- Webpack
- Jest

For Nuxt 3 see version `2.x` or greater

## Installation

```sh
$ yarn add -D @netsells/vue-storybook-test-utils
``` 

## Setup

Ensure your project has a jest config, and create a `setupFilesAfterEnv` file, for example:

```json
{
    "setupFilesAfterEnv": [
        "<rootDir>/tests/setup.js"
    ]
}
```

Within the file you should define any mocks, stubs, globals, etc that your test suite may rely on. This module provides helpers to facilitate this setup:

```js
import { setStubs, setMocks, mockComponents, mockDirectives, mockStore, setupPlugins } from '@netsells/vue-storybook-test-utils';
import SlightlyImportantComponent from './stubs/SlightlyImportantComponent';
import moment from './mocks/moment';
import importantDirective from './mocks/important-directive';
import { BButton } from 'bootstrap-vue';
import MyPlugin from 'my-plugin';

// Stub any global components
setStubs({
    'unimportant-component': true,
    'slightly-important-component': SlightlyImportantComponent,
});

// Mock any global Vue properties
setMocks({
    $moment: moment,
});

// Register global components. This is similar to `setStubs` but assumes fully functional components
// e.g. here you would register bootstrap-vue globals
mockComponents({
    BButton,
});

// Mock any directives that might be used in your app
mockDirectives({
    'unimportant-directive': true, // Directive will be essentially noop'd to prevent errors
    'important-directive': importantDirective,
});

// Mock the store used in your application
// Avoid basing any mutable tests on this data, as it will change between your tests and create dirty data
// For testing with the store, refer to the `localVue` section below
mockStore({
    modules: {
        global: {
            state: {
                menu_open: false,
            },
            namespaced: true,
        },
    },
});

// Register any global plugins here:
setupPlugins([
    MyPlugin,
]);
```

## Testing

Take the following story:

<details>
<summary>TextInput.stories.js</summary>

```js
import TextInput from './TextInput';

export default {
    component: TextInput,

    argTypes: {
        disabled: {
            control: 'boolean',
        },
    },

    args: {
        label: 'My Input',
    },
};

export const textInput = (args = {}, { argTypes = {} }) => ({
    props: Object.keys({ ...args, ...argTypes }),

    components: { TextInput },

    template: `
        <text-input v-bind="$props" />
    `,
});

export const disabled = textInput.bind({});
disabled.args = {
    disabled: true,
};
```

</details>

Instead of invidually pulling in your stories and setting them up with the same data, you can leave it up to the `generateStorySuite` function to generate a suite of factories to help bootstrap your tests. For example:

```js
import { generateStorySuite } from '@netsells/vue-storybook-test-utils';
import * as TextInput from './TextInput.stories';

const suite = generateStorySuite(TextInput);

describe('TextInput', () => {
    test('test default state', () => {
        const wrapper = suite.textInput({
            mocks: {
                'nuxt-link': true,
            },
            // Any additional setup config you may need for this component
        });
        
        // The default factory function is shorthand for the following:
        const wrapper = suite.textInput.mountStory(config);
        
        // If you prefer a shallow mount you can call the respective method:
        const wrapper = suite.textInput.shallowMountStory(config);
        
        // If you wish to just render the story you can use the following:
        const wrapper = suite.textInput.renderStory(config);
        
        // If for any reason you require access to the raw story, it can be accessed via the `story` property:
        console.log(suite.textInput.story);
    });
    
    test('test disabled state', () => {
        // To run tests against the `disabled` story:
        const wrapper = suite.disabled(config);
        
        // As above, you can also call the `mountStory`, `shallowMount` and 
        // `renderStory` methods to suite your testing needs
    });
    
    test('test the component directly', () => {
        // If you would prefer to test the component directly, you can do so using the following:
        const wrapper = suite.component(config);
        
        // The default factory function is shorthand for the following:
        const wrapper = suite.component.mount(config);
        
        // If you prefer a shallow mount you can call the respective method:
        const wrapper = suite.component.shallowMount(config);
        
        // If you wish to just render the component you can use the following:
        const wrapper = suite.component.render(config);
    });
});
```

### TestId

Sometimes it's helpful to add a specific attribute to your tests to quickly and easily access your testable elements, without having to rely on specific markup. For this we recommend adding a `data-testid="someKey"` to your testable elements, and using the `findByTestId` helper. For example:

```vue
<ul>
    <li>Some item I don't want to test</li>
    <li data-testid="testableListItem">My testable element</li>
    <li>Another item I don't want to test</li>
</ul>
```

In the above example, previously you might do something like:

```js
const listItem = wrapper.findAll('li').at(1);
```

The problem here, is that if you later add another list item above this, your test will fail, even though the content of the `li` may be correct.

With the introduction of the `data-testid` attribute we're able to avoid this problem by strictly fetching the item we need, e.g.:

```js
const listItem = wrapper.find('[data-testid="testableListItem"]');
```

For further reading on this method, check out this [article by Kent C. Dodds](https://kentcdodds.com/blog/making-your-ui-tests-resilient-to-change).

#### `findByTestId`

Typing out the full accessor path is a lot of duplication, so we can instead use the provided helper:

```js
const listItem = wrapper.findByTestId('testableListItem');
```

#### `findAllByTestId`

You can also use the `findAllByTestId` method for finding multiple testIds.

```js
const listItems = wrapper.findAllByTestId('testableListItem')
```

#### `findComponentByTestId`

If you have multiple of the same component and can't easily target it with a `findComponent`, you can use the `findComponentByTestId` method to do this. For example:

```vue
<my-component data-testid="componentOne" />
<my-component data-testid="componentTwo" />
<my-component data-testid="componentThree" />

<my-component
    v-for="i in 5"
    data-testid="repeatedComponents"
/>
```

You can differentiate and access the individual components using the following:

```js
// Returns a single wrapper
const componentOne = wrapper.findComponentByTestId({ 
    name: 'my-component', 
}, 'componentOne'); 
// Returns a single wrapper
const componentTwo = wrapper.findComponentByTestId({ 
    name: 'my-component',
}, 'componentTwo');
```

Doing the above allows you to easily assert that the element you want to access is the correct component as well as ensuring it's the correct individual component you need to access.

#### `findAllComponentsByTestId`

If you need to access multiple components, for example to access a repeated collection, you can use this helper to return a wrapper array.

```vue
<my-component data-testid="componentOne" />
<my-component data-testid="componentTwo" />
<my-component data-testid="componentThree" />

<my-component
    v-for="i in 5"
    data-testid="repeatedComponents"
/>
```

You can differentiate and access the collection of components using the following:

```js
// Returns a wrapper array
const repeatedComponents = wrapper.findAllComponentsByTestId({ 
    name: 'my-component', 
}, 'repeatedComponents');
```

#### `v-test` directive

To make this easier in your template, you can also make use of the provided `v-test` directive. Simply pull in and register the directive like so:

```js
// setup.js
import test from '@netsells/vue-storybook-test-utils/directives/test'

mockDirectives({
    test,
});
```

Once pulled in, this directive can be used like so:

```vue
<ul>
    <li>Some item I don't want to test</li>
    <li v-test:testableListItem>My testable element</li>
    <li>Another item I don't want to test</li>
</ul>
```

There is also a simple nuxt module to prevent this method erroring in production. Simply add `'@netsells/vue-storybook-test-utils/nuxt'` to your `buildModules` section.

These data attributes will only render in test environments, i.e. in jest and storybook.

## Routes

If your components/stories feature routes, you can provide these via the `router.routes` parameter on your story definitions.

Before this will work, you must mock the router in your setup file:

```js
import { mockRouter } from '@netsells/vue-storybook-test-utils';

mockRouter({
    // Any vue-router config options can be passed here
});
```

You can then provide your routes within your stories:

```js
export default {
    parameters: {
        router: {
            routes: [
                {
                    name: 'account',
                    path: '/account',
                },
            ],
        },
    },
};
```

You can also provide routes to specific stories if required:

```js
story.parameters = {
    router: {
        routes: [
            {
                name: 'account',
                path: '/account',
            },
        ],
    },
};
```

## Component Access

You can access the component import itself via `suite.utils.component`. You can also use `wrapper.getComponent()` to retrieve the main component you're testing. This may be helpful if you have a dynamic test suite that needs to find the component within the story, e.g.:

```js
describe('when the input is updated', () => {
    test('the new value is emitted', async () => {
        const wrapper = suite.textInput();
        const component = wrapper.getComponent();
        const input = wrapper.find('input');

        await input.setValue('New value');

        expect(component.emitted('input').length).toBe(1);
        expect(wrapper.vm.val).toBe('New value');
    });
});
```

Similarly, the entire `default` export of your story is available as `suite.utils.defaultExport` if required.

## `localVue`

Unlike the `localVue` property available on `@vue/test-utils`, you should provide a callback rather than an instance of your own. This reduces manual boilerplate and makes it more familiar to set up. The first argument of the callback is a Vue instance localised to your test. You should use this to setup any Vuex modules you may require in your tests.

```js
const wrapper = suite.myComponent({
    localVue(Vue) {
        // Use `Vue` as you would normally, e.g. `Vue.use`, `Vue.mixin`
    },
});
```

## Misc Utilities

### `waitForAnimationFrame`

Returns a promise that resolves after the current repaint to ensure any animations have completed.

### `@vue/test-utils` raw functions

We also pass through all the `@vue/test-utils` methods as they are in the original package, with the exception of `mount` and `shallowMount`, as these are overridden with additional functionality from this module. Should you require access to these methods, they can be called with the `raw` prefix, e.g. `rawMount` and `rawShallowMount`.
