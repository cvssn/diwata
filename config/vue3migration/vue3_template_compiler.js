const {
    parse,
    compile: compilerDomCompile
} = require('@vue/compiler-dom');

// elementos personalizados que não devem ser resolvidos como
// componentes vue. definido aqui porque o webpack 4 não consegue
// serializar funções em opções de carregamento
const CUSTOM_ELEMENTS = [
    'gl-emoji',
    'fe-island-duo-next',
    'fe-island-visual-ci-editor'
];

const isCustomElement = (tag) => CUSTOM_ELEMENTS.includes(tag);

const COMMENT_NODE_TYPE = 3;

const hasProp = (node, prop) => node.props?.some((p) => p.name === prop);

function modifyKeysInsideTemplateTag(templateNode) {
    if (!templateNode.tag === 'template' || !hasProp(templateNode, 'for')) {
        return;
    }

    let keyCandidate = null;

    for (const node of templateNode.children) {
        const keyBindingIndex = node.props ? node.props.findIndex((prop) => prop.arg && prop.arg.content === 'key') : -1;

        if (keyBindingIndex !== -1 && !hasProp(node, 'for')) {
            if (!keyCandidate) {
                keyCandidate = node.props[keyBindingIndex];
            }

            node.props.splice(keyBindingIndex, 1);
        }
    }

    if (keyCandidate) {
        templateNode.props.push(keyCandidate);
    }
}

function getSlotName(node) {
    return node?.props?.find((prop) => prop.name === 'slot')?.arg?.content;
}

function filterCommentNodeAndTrailingSpace(node, idx, list) {
    if (node.type === COMMENT_NODE_TYPE) {
        return false;
    }

    if (node.content !== ' ') {
        return true;
    }

    if (list[idx - 1]?.type === COMMENT_NODE_TYPE) {
        return false;
    }

    return true;
}

function filterCommentNodes(node) {
    const { length: originalLength } = node.children;

    // eslint-disable-next-line no-param-reassign
    node.children = node.children.filter(filterCommentNodeAndTrailingSpace);
    
    if (node.children.length !== originalLength) {
        // apara os espaços restantes
        while (node.children.at(-1)?.content === ' ') {
            node.children.pop();
        }
    }
}

function dropVOnceForChildrenInsideVIfBecauseOfIssue7725(node) {
    // https://github.com/vuejs/core/issues/7725 para mais detalhes
    if (!hasProp(node, 'if')) {
        return;
    }

    node.children?.forEach((child) => {
        if (Array.isArray(child.props)) {
            // eslint-disable-next-line no-param-reassign
            child.props = child.props.filter((prop) => prop.name !== 'once');
        }
    });
}

function fixSameSlotsInsideTemplateFailingWhenUsingWhitespacePreserveDueToIssue6063(node) {
    // https://github.com/vuejs/core/issues/6063 para mais detalhes

    // eslint-disable-next-line no-param-reassign
    node.children = node.children.filter((child, idx) => {
        if (child.content !== ' ') {
            // é preciso remover apenas os nodes de comentário
            return true;
        }

        const previousNodeSlotName = getSlotName(node.children[idx - 1]);
        const nextNodeSlotName = getSlotName(node.children[idx + 1]);

        if (previousNodeSlotName && previousNodeSlotName === nextNodeSlotName) {
            // tem um espaço entre duas entradas de slot com o mesmo
            // nome de slot; é preciso removê-lo
            return false;
        }

        return true;
    });
}

function transformAst(rootNode) {
    const pendingNodes = [rootNode];

    while (pendingNodes.length) {
        const currentNode = pendingNodes.pop();

        if (Array.isArray(currentNode.children)) {
            // esta funcionalidade será completamente removida juntamente com o
            // compilador quando descontinuarmos o suporte ao vue.js 2
            modifyKeysInsideTemplateTag(currentNode);

            dropVOnceForChildrenInsideVIfBecauseOfIssue7725(currentNode);

            // https://github.com/vuejs/core/issues/7909 para mais detalhes

            // no entanto, esse problema não se aplica apenas a nodes de nível root
            // mas, em qualquer nível, os comentários podem alterar a detecção de
            // espaços vazios, então simplesmente os descartamos
            filterCommentNodes(currentNode);

            fixSameSlotsInsideTemplateFailingWhenUsingWhitespacePreserveDueToIssue6063(currentNode);

            currentNode.children.forEach((child) => pendingNodes.push(child));
        }
    }

    return rootNode;
}

module.exports = {
    isCustomElement,
    parse,

    compile(template, options) {
        // o modelo pode ser uma string ou uma ast já
        // analisada (rootnode)
        const rootNode = typeof template === 'string' ? parse(template, options) : template;

        transformAst(rootNode);

        return compilerDomCompile(rootNode, {
            isCustomElement,
            
            ...options
        });
    }
};