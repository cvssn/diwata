import { readFileSync } from 'node:fs';
import path from 'node:path';

import { defineConfig } from 'vite';
import vue2 from '@vitejs/plugin-vue2';

// eslint-disable-next-line import/no-unresolved -- falso positivo: eslint não lê `exports` e reports `unresolved` (https://github.com/import-js/eslint-plugin-import/issues/1810)
import vue3 from '@vitejs/plugin-vue';
import graphql from '@rollup/plugin-graphql';
import glob from 'glob';

const {
    VUE_VERSION = '2',
    VUE_COMPILER_VERSION = '2'
} = process.env;

if (!['2', '3'].includes(VUE_VERSION)) {
    throw new Error(`valor vue_version inválido: ${VUE_VERSION}. apenas '2' ou '3' é suportado`);
}

if (!['2', '3'].includes(VUE_COMPILER_VERSION)) {
    throw new Error(`valor vue_compiler_version inválido: ${VUE_COMPILER_VERSION}. apenas '2' ou '3' é suportado`);
}

const USE_VUE3 = VUE_VERSION === '3';
const USE_VUE3_COMPILER = USE_VUE3 && VUE_COMPILER_VERSION === '3';

console.log(`[v] utilizando vue.js ${VUE_VERSION} (compilador ${VUE_COMPILER_VERSION})`);

const vue = USE_VUE3_COMPILER ? vue3 : vue2;

let viteGDKConfig;