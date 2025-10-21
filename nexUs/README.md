# NexUS - Clube Empreendedor

Landing page estática construída com HTML, CSS e JavaScript seguindo boas práticas de acessibilidade, SEO e responsividade.

## Como usar

- Abra o arquivo `index.html` no navegador.
- Opcional: sirva a pasta com um servidor estático para melhor experiência (cache/rotas), por exemplo:

```bash
python3 -m http.server 5173
# depois acesse http://localhost:5173
```

## Estrutura

- `index.html`: marcação semântica e metas de SEO/OpenGraph
- `styles/styles.css`: estilos responsivos com design tokens (CSS variables), light/dark
- `scripts/script.js`: interações (menu mobile, rolagem suave, toggle de tema, formulário)
- `scripts/auth.js`: autenticação (login/cadastro, estado de sessão, área de membros)
- `scripts/firebase-config.js`: inicialização do Firebase (edite com suas chaves)
- `assets/logo.svg`: logotipo em SVG

## Boas práticas aplicadas

- Semântica HTML com `header`, `main`, `section`, `nav`, `footer`
- Acessibilidade: `skip-link`, `aria-*` nos controles, foco gerenciado pós-scroll, contraste
- Responsividade com CSS Grid/Flex e `clamp()` para tipografia fluida
- Design tokens (CSS variables) e suporte a `prefers-color-scheme`
- Toggle de tema com `localStorage` e `data-theme`
- SEO: `meta description`, OpenGraph/Twitter, `title`, `viewport`
- Performance: imagens com `loading="lazy"`, CSS crítico simples, sem fontes externas

## Personalização

- Cores: ajuste em `styles/styles.css` nas variáveis `--brand-*`, `--bg`, `--text` etc.
- Seções: edite/adicione blocos em `index.html` conforme necessidade.
- Scripts: acrescente integrações (analytics, formulário real) em `scripts/script.js`.

## Habilitar Login/Cadastro (Firebase Auth)

Compatível com GitHub Pages (cliente puro).

1) Crie um projeto em Firebase Console e adicione um app Web.
2) Copie as credenciais e edite `scripts/firebase-config.js` substituindo os `REPLACE_ME`.
3) Em Authentication > Sign-in method, ative Email/Password.
4) Em Authentication > Settings, defina domínios autorizados (ex.: `seu-usuario.github.io`).
5) Faça deploy no GitHub Pages. A página detecta o login e libera a seção `#membros`.


## Licença

Este projeto é fornecido como base educacional. Use e adapte livremente.


