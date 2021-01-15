import { resolve } from 'path';

export default function VueTestUtilsModule(moduleOptions = {}) {
    const options = {
        ...moduleOptions,
    };

    const { dst } = this.addTemplate({
        src: resolve(__dirname, './plugin.js'),
        fileName: './vue-test-utils/plugin.js',
        options,
    });

    this.options.plugins.push(resolve(this.options.buildDir, dst));
}
