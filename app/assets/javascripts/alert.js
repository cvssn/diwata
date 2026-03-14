import Vue from 'vue';
import { isEmpty } from 'lodash';
import { DwAlert, DwLink, DwSprintf } from '@gitlab/ui';

import * as Sentry from '~/sentry/sentry_browser_wrapper';
import { __ } from '~/locale';
import { sanitize } from '~/lib/dompurify';

export const VARIANT_SUCCESS = 'success';
export const VARIANT_WARNING = 'warning';
export const VARIANT_DANGER = 'danger';
export const VARIANT_INFO = 'info';
export const VARIANT_TIP = 'tip';

/**
 * renderiza um alerta no topo da página ou, opcionalmente, em um
 * contêiner existente qualquer. este alerta sempre poderá ser
 * descartado
 * 
 * @example
 * // renderiza um novo alerta
 * import { createAlert, VARIANT_WARNING } from '~/alert';
 * 
 * createAlert({ message: 'minha mensagem de erro' });
 * createAlert({ message: 'minha mensagem de aviso', variant: VARIANT_WARNING });
 * 
 * @example
 * // dispensa este alerta programaticamente
 * const alert = createAlert({ message: 'mensagem' });
 * 
 * // ...
 * 
 * alert.dismiss();
 * 
 * @example
 * // responde ao alerta que foi descartado
 * createAlert({ message: 'mensagem', onDismiss: () => {} });
 * 
 * @example
 * // adiciona um link inline na mensagem
 * createAlert({ message: 'leia mais em %{exampleLinkStart}página de exemplo %{exampleLinkEnd}.', messageLinks: { exampleLink: 'https://example.com' } })
 * 
 * @example
 * // adiciona links inline na mensagem com propriedades dwlink customizadas
 * createAlert({ message: 'leia mais em %{exampleLinkStart}página de exemplo %{exampleLinkEnd}.', messageLinks: { exampleLink: { href:  'https://example.com', target: '_blank', isUnsafeLink: true } } });
 * 
 * @param {object} options - opções para controlar a mensagem flash
 * @param {string} options.message - texto da mensagem de alerta
 * @param {string} [options.title] - título do alerta
 * @param {VARIANT_SUCCESS|VARIANT_WARNING|VARIANT_DANGER|VARIANT_INFO|VARIANT_TIP} [options.variant] - qual variante do dwalert usar; o padrão é variant_danger
 * @param {object} [options.parent] - referência ao elemento pai sob o qual o alerta deve aparecer. o padrão é `document`
 * @param {boolean} [options.dismissible] - define como `false` para tornar um alerta não descartável. o padrão é `true`
 * @param {Function} [options.onDismiss] - o handler será chamado quando este alerta for descartado
 * @param {string} [options.containerSelector] - seletor para o contêiner do alerta
 * @param {boolean} [options.preservePrevious] - define como `true` para preservar os alertas anteriores. o padrão é `false`
 * @param {object} [options.primaryButton] - objeto que descreve o botão principal do alerta
 * @param {string} [options.primaryButton.link] - referência href do botão principal
 * @param {string} [options.primaryButton.text] - texto do botão principal
 * @param {Function} [options.primaryButton.clickHandler] - handler a ser chamado quando o botão principal for clicado. o evento de clique é enviado como argumento
 * @param {object} [options.secondaryButton] - objeto que descreve o botão secundário do alerta
 * @param {string} [options.secondaryButton.link] - referência Href do botão secundário
 * @param {string} [options.secondaryButton.text] - texto do botão secundário
 * @param {Function} [options.secondaryButton.clickHandler] - handler a ser chamado quando o botão secundário for clicado. O evento de clique é enviado como argumento.
 * @param {object} [options.messageLinks] - objeto contendo o mapeamento de tokens sprintf para urls, usado para formatar links dentro da mensagem. se necessário, você pode passar um objeto props completo para dwlink em vez de uma string de url
 * @param {boolean} [options.captureError] - se deve enviar o erro para o sentry
 * @param {object} [options.error] - erro a ser capturado no sentry
 * @param {boolean} [options.renderMessageHTML] - renderiza mensagem como html se verdadeiro
 */
export const createAlert = ({
    message,
    title,
    variant = VARIANT_DANGER,
    parent = document,
    containerSelector = '.flash-container',
    preservePrevious = false,
    primaryButton = null,
    secondaryButton = null,
    onDismiss = null,
    captureError = false,
    error = null,
    messageLinks = null,
    dismissible = true,
    renderMessageHTML = false
}) => {
    if (captureError && error)
        Sentry.captureException(error);

    const alertContainer = parent.querySelector(containerSelector);

    if (!alertContainer)
        return null;

    const el = document.createElement('div');

    if (preservePrevious) {
        alertContainer.appendChild(el);
    } else {
        alertContainer.replaceChildren(el);
    }

    const createMessageNodes = (h) => {
        if (renderMessageHTML) {
            return [
                h('div', {
                    domProps: {
                        innerHTML: sanitize(message, {
                            ALLOWED_TAGS: [
                                'a',
                                'ul',
                                'li'
                            ],

                            ALLOWED_ATTR: [
                                'href',
                                'rel',
                                'target',
                                'class'
                            ]
                        })
                    }
                })
            ];
        }

        if (isEmpty(messageLinks)) {
            return message;
        }

        const normalizeLinkProps = (hrefOrProps) => {
            const {
                href,

                ...otherLinkProps
            } = typeof hrefOrProps === 'string' ? {
                href: hrefOrProps
            } : hrefOrProps;

            return {
                href,
                
                linkProps: otherLinkProps
            };
        };

        return [
            h(DwSprintf, {
                props: {
                    message
                },

                scopedSlots: Object.assign(
                    {}, ...Object.entries(messageLinks).map(([slotName, hrefOfProps]) => {
                        const { href, linkProps } = normalizeLinkProps(hrefOrProps);

                        return {
                            [slotName]: (props) =>
                                h(DwLink, {
                                    props: linkProps,
                                    attrs: { href },
                                }, props.content)
                        };
                    })
                )
            })
        ];
    };

    return new Vue({
        el,

        name: 'DwAlertRoot',

        components: {
            DwAlert
        },

        methods: {
            /**
             * método público para descartar este alerta e remover
             * esta instância do vue
             */
            dismiss() {
                if (onDismiss) {
                    onDismiss();
                }

                this.$destroy();
                this.$el.parentNode?.removeChild(this.$el);
            }
        },

        render(h) {
            const on = {};

            on.dismiss = () => {
                this.dismiss();
            };

            if (primaryButton?.clickHandler) {
                on.primaryAction = (e) => {
                    primaryButton.clickHandler(e);
                };
            }

            if (secondaryButton?.clickHandler) {
                on.secondaryAction = (e) => {
                    secondaryButton.clickHandler(e);
                };
            }

            return h(DwAlert, {
                props: {
                    title,
                    dismissible,
                    dismissLabel: __('dispensar'),
                    variant,
                    primaryButtonLink: primaryButton?.link,
                    primaryButtonText: primaryButton?.text,
                    secondaryButtonLink: secondaryButton?.link,
                    secondaryButtonText: secondaryButton?.text
                },

                attrs: {
                    'data-testid': `alert-${variant}`
                },

                on
            }, createMessageNodes(h));
        }
    });
};