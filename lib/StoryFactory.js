import { mount } from '@vue/test-utils';
import { createRouter, createWebHistory } from 'vue-router';
import { createTestingPinia } from '@pinia/testing';
import { vi } from 'vitest';

class StoryFactory {
    constructor(story) {
        this.story = story;

        this.plugins = [];
        this.router = null;
    }

    mockRouter(routerConfig = {}) {
        this.router = createRouter({
            history: createWebHistory(),
            ...routerConfig,
        });

        this.plugins.push(this.router);

        return this;
    }

    mockStore(storeConfig = {}) {
        this.store = createTestingPinia({
            createSpy: vi.fn,
        });

        this.plugins.push(this.store);

        return this;
    }

    mountStory(config = {}) {
        const storyFunc = typeof this.story === 'function'
            ? this.story
            : this.story.render;

        const story = storyFunc(this.story.args, {
            argTypes: {
                ...this.story.argTypes,
                ...this.story.args,
            },
        });

        this.mockStore(config.store);

        const wrapper = mount(story, {
            ...config,
            global: {
                ...config.global,
                plugins: this.plugins,
            },
        });

        wrapper.router = this.router;

        return wrapper;
    }

    getStory() {
        return this.story;
    }
}

export default StoryFactory;
