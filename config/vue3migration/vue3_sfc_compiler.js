/**
 * compilador sfc customizado para migração do vue 3
 * 
 * isso envolve o @vue/compiler-sfc e injeta nosso compilador de
 * modelos personalizados para aplicar as transformações ast
 * necessárias para a compatibilidade com o vue 2
 * 
 * utilizado pelo @vitejs/plugin-vue quando vue_version=3
 */
import * as defaultCompiler from '@vue/compiler-sfc';
import vue3TemplateCompiler from './vue3_template_compiler.js';

export * from '@vue/compiler-sfc';

export function compileTemplate(options) {
    return defaultCompiler.compileTemplate({
        ...options,

        compiler: vue3TemplateCompiler
    });
}