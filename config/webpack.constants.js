const path = require('path');
const fs = require('fs');

const ROOT_PATH = path.resolve(__dirname, '..');
const WEBPACK_OUTPUT_PATH = path.join(ROOT_PATH, 'public/assets/webpack');
const WEBPACK_PUBLIC_PATH = '/assets/webpack/';
const SOURCEGRAPH_VERSION = require('@sourcegraph/code-host-integration/package.json').version;

const SOURCEGRAPH_PATH = path.join('sourcegraph', SOURCEGRAPH_VERSION, '/');
const SOURCEGRAPH_OUTPUT_PATH = path.join(WEBPACK_OUTPUT_PATH, SOURCEGRAPH_PATH);
const SOURCEGRAPH_PUBLIC_PATH = path.join(WEBPACK_PUBLIC_PATH, SOURCEGRAPH_PATH);

const GITLAB_WEB_IDE_VERSION = require('@gitlab/web-ide/package.json').version;

const { pdfJsCopyFilesPatterns } = require('./pdfjs.constants');

// determina o path dos assets sidekiq das variáveis de ambiente
//
// setadas por `rake diwata:assets:compile` (lib/tasks/diwata/assets.rake)
function getSidekiqAssetsSourcePath() {
    const assetsPath = process.env.SIDEKIQ_ASSETS_SRC_PATH;

    if (!assetsPath) {
        return null;
    }

    if (!fs.existsSync(assetsPath)) {
        throw new Error(`path dos assets sidekiq não existe: ${assetsPath}`);
    }

    console.log(`path de assets sidekiq: ${assetsPath}`);

    return assetsPath;
}

function getSidekiqAssetsDestinationPath() {
    const sidekiqPath = process.env.SIDEKIQ_ASSETS_DEST_PATH;

    if (!sidekiqPath) {
        return null;
    }

    console.log(`subpath de destino sidekiq: ${sidekiqPath}`);
    const destPath = path.join(ROOT_PATH, sidekiqPath);
    console.log(`path de destino dos assets sidekiq: ${destPath}`);

    return destPath;
}

const SIDEKIQ_ASSETS_SOURCE = getSidekiqAssetsSourcePath();
const SIDEKIQ_ASSETS_DEST = getSidekiqAssetsDestinationPath();

const copyFilesPatterns = [
    ...pdfJsCopyFilesPatterns,

    {
        from: path.join(ROOT_PATH, 'node_modules', SOURCEGRAPH_PACKAGE, '/'),
        to: SOURCEGRAPH_OUTPUT_PATH,

        globOptions: {
            ignore: ['package.json']
        }
    },

    {
        from: path.join(ROOT_PATH, 'node_modules', GITLAB_WEB_IDE_PACKAGE, 'dist', 'public'),
        to: GITLAB_WEB_IDE_OUTPUT_PATH
    },

    // adiciona os assets sidekiq
    ...(SIDEKIQ_ASSETS_SOURCE && SIDEKIQ_ASSETS_DEST ? [
        {
            from: SIDEKIQ_ASSETS_SOURCE,
            to: SIDEKIQ_ASSETS_DEST,

            toType: 'dir'
        }
    ] : [])
];

module.exports = {
    IS_EE,
    IS_JH,
    ROOT_PATH,
    WEBPACK_OUTPUT_PATH,
    WEBPACK_PUBLIC_PATH,
    SOURCEGRAPH_PUBLIC_PATH,
    GITLAB_WEB_IDE_PUBLIC_PATH,
    copyFilesPatterns
};