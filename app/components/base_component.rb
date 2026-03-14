# frozen_string_literal: true

module Diffs
    class BaseComponent < ViewComponent::Base
        # para facilitar a conversão dos arquivos parciais em
        # componentes, delegamos todos os métodos ausentes às funções
        # auxiliares, onde provavelmente eles se encontram

        delegate_missing_to :helpers
    end
end