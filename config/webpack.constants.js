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