# Guilherme Araújo — Portfólio

Portfólio pessoal de Guilherme Araújo, Software Developer e estudante de Ciência da Computação. O projeto reúne apresentação profissional, stack, projetos selecionados e canais de contato em uma experiência interativa e responsiva.

## Estado atual

A fundação visual foi migrada do antigo Linktree e agora vive em um repositório próprio. Esta versão já inclui:

- hero com cena 3D carregada sob demanda;
- apresentação, stack e interesses profissionais;
- projetos em destaque com links para demo e código;
- animações de entrada, spotlight, tilt e microinterações;
- navegação responsiva e contato direto;
- suporte a teclado, redução de movimento e economia de dados;
- metadados sociais e imagem de compartilhamento própria.

## Tecnologias

- HTML semântico
- CSS responsivo
- JavaScript modular
- Three.js
- Vite
- Cloudflare Workers/Vite Plugin

## Desenvolvimento local

Requisitos: Node.js 22 ou superior e npm.

```bash
npm ci
npm run dev
```

O servidor local será exibido no endereço informado pelo Vite.

## Comandos

```bash
npm run dev      # ambiente de desenvolvimento
npm run build    # build otimizado de produção
npm run preview  # prévia local do build
```

## Estrutura

```text
.
├── public/              # foto e imagem social
├── worker/              # entrada do Worker para hospedagem
├── index.html           # conteúdo e estrutura semântica
├── styles.css           # sistema visual e responsividade
├── script.js            # interações e cena Three.js
├── vite.config.js       # configuração de desenvolvimento/build
└── wrangler.jsonc       # configuração do Worker
```

## Fluxo Git

- `main`: versão estável e revisada;
- `agent/*`: trabalho conduzido com assistência automatizada;
- `feat/*`: novas funcionalidades e seções;
- `fix/*`: correções;
- `chore/*`: manutenção e infraestrutura.

Os commits seguem o padrão Conventional Commits, como `feat:`, `fix:`, `docs:` e `chore:`. Toda mudança relevante deve passar por uma pull request com build validado.

## Próximos passos

- [x] Migrar a fundação interativa para o repositório próprio
- [x] Configurar validação automática no GitHub
- [ ] Refinar narrativa, identidade e apresentação pessoal
- [ ] Transformar projetos em estudos de caso completos
- [ ] Definir domínio definitivo e atualizar SEO/canonical
- [ ] Adicionar métricas de uso com consentimento e privacidade

## Contato

- [GitHub](https://github.com/Guilhermegg-06)
- [LinkedIn](https://www.linkedin.com/in/guilherme-araujo-620006340/)
- [E-mail](mailto:ggdev0001@gmail.com)
