import { defineNuxtModule, addPlugin, createResolver } from '@nuxt/kit';

export default defineNuxtModule({
    meta: {
        name: '@netsells/vue-storybook-test-utils',
        compatibility: {
            // Semver version of supported nuxt versions
            nuxt: '^3.0.0',
        },
    },
    async setup() {
        // Create resolver to resolve relative paths
        const { resolve } = createResolver(import.meta.url)

        addPlugin(resolve('./plugin'))
    },
});
