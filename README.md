# 🌌 Waifu Vault v2.0

<div align="center">
  <img src="https://img.shields.io/badge/Version-2.1.0-blueviolet?style=for-the-badge" alt="Version" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-6.2-646CFF?style=for-the-badge&logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/Premium-UI-FF69B4?style=for-the-badge" alt="Premium UI" />
</div>

---

## 🌟 Visão Geral

O **Waifu Vault** é uma plataforma de descoberta de mídia de alta fidelidade, projetada para centralizar a exploração de arte, mangás e vídeos de diversas fontes populares (Image Boards). Com foco em **UX Premium**, **Interatividade Dinâmica** e um sistema de **Tematização Universal**, o Vault oferece uma experiência de software nativo diretamente no navegador.

Seja você um entusiasta de arte digital, um leitor de mangás ou um criador utilizando IA (Stable Diffusion/ComfyUI), o Waifu Vault é o seu portal definitivo.

---

## ✨ Funcionalidades Principais

### 🎨 Interface de Usuário Premium
- **Experiência Glassmorphism**: Design moderno com efeitos de desfoque de fundo (backdrop-blur) e camadas translúcidas.
- **Home Dinâmica**: Uma página de entrada inspirada em motores de busca premium com carrosséis adaptativos.
- **Micro-animações**: Transições suaves, escalonamento no hover e loaders de barra de progresso otimizados.
- **Modo Escuro/Claro Global**: Sistema de temas completo que se adapta a todos os componentes, do Sidebar aos Modais.

### 🔍 Exploração Multi-Fonte
- **Busca Unificada**: Integração nativa com **Waifu.im**, **Gelbooru**, **Rule34**, **Konachan** e **Yandere**.
- **Tag Explorer**: Navegação avançada por Artistas, Personagens e Metadados com pré-visualizações em tempo real.
- **Filtragem Inteligente**: Suporte a busca por tags, tipos de conteúdo (Imagens, GIFs, Vídeos) e fontes específicas.

### 📚 Módulos Especializados
- **📖 NHentai Reader**: Leitor de mangás integrado com busca e visualização completa de volumes.
- **📺 HH Explorer**: Navegador de séries e animações via HentaiHaven.
- **🎬 R34 Video Player**: Player de vídeo otimizado com suporte a busca (seeking) e carregamento sob demanda.
- **🤖 Integração ComfyUI**: Visualize suas gerações locais do Stable Diffusion, explore pastas de saída e inicie o servidor ComfyUI diretamente do Vault.

### 🔒 Segurança e Privacidade
- **NSFW Gate**: Toggle de segurança global que oculta conteúdo sensível atrás de confirmações e filtros automáticos (ex: `-rating:explicit`).
- **Proxy Anti-CORS**: Sistema integrado para burlar restrições de hotlinking e Cloudflare de fontes externas.

---

## 🛠️ Stack Tecnológica

- **Frontend**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 6](https://vitejs.dev/)
- **Estilização**: CSS Moderno (Vanilla + Variáveis Dinâmicas)
- **Parsing**: [Cheerio](https://cheerio.js.org/) para scraping de alta performance.
- **Plugins**: Plugin Vite customizado para integração com sistema de arquivos local (ComfyUI).

---

## 🚀 Como Executar em Outros Computadores

Para rodar o Waifu Vault em uma nova máquina, siga estas diretrizes essenciais:

### 1. Pré-requisitos
- **Node.js**: Versão 18.0 ou superior.
- **Gerenciador de Pacotes**: npm ou yarn.

### 2. Instalação
```bash
# Clone o repositório
git clone https://github.com/raphawestim/Waifu_valt_Project.git
cd Waifu_valt_Project

# Instale as dependências
npm install
```

### 3. Configuração de Ambiente (`.env.local`)
Crie um arquivo chamado `.env.local` na raiz do projeto e configure as chaves necessárias:
```env
GEMINI_API_KEY=sua_chave_aqui
NHENTAI_API_KEY=sua_chave_nhentai_aqui
```

### 4. Ajustes de Caminhos Locais (Importante!)
Se você planeja usar o módulo **ComfyUI**, deve atualizar os caminhos no arquivo `comfyui-plugin.ts` para refletir a estrutura de pastas do seu computador:

1. Abra `comfyui-plugin.ts`.
2. Localize e altere as constantes:
   - `COMFYUI_OUTPUT_DIR`: Caminho para a pasta `/output` do seu ComfyUI.
   - `COMFYUI_BAT_PATH`: Caminho para o seu arquivo `.bat` de inicialização (ex: `run_nvidia_gpu.bat`).

### 5. Execução
```bash
# Iniciar em modo de desenvolvimento
npm run dev
```

---

## 🏗️ Arquitetura e Funcionamento

### Sistema de Plugins e Proxies
O projeto utiliza uma arquitetura baseada em **Service Proxies**. Devido às restrições de CORS de muitos Image Boards, as requisições de API passam por uma camada de proxy (`api.codetabs.com` ou `corsproxy.io`) configurada em `imageService.ts`.

### Integração Local (Vite Middleware)
Diferente de aplicações web comuns, o Vault usa o `configureServer` do Vite para criar endpoints de API locais (`/api/comfyui/*`). Isso permite que o frontend interaja com o seu sistema de arquivos de forma segura para gerenciar suas imagens geradas por IA.

### Gerenciamento de Estado
- **AuthContext**: Gerencia "favoritos" e "listas" (atualmente persistidos em LocalStorage).
- **ThemeContext**: Controla a alternância dinâmica entre temas sem recarregar a página.

---

## 📸 Screenshots

> [!TIP]
> O design é 100% responsivo. Experimente a "Vault View" em telas largas para uma experiência imersiva de galeria!

| Desktop Home | Manga Reader | ComfyUI Panel |
| :---: | :---: | :---: |
| ✨ *Interface Glass* | 📖 *Modo Leitura* | 🤖 *IA Local* |

---

## 🤝 Contribuição

Contribuições são o que tornam a comunidade incrível! Sinta-se à vontade para:
1. Abrir **Issues** para relatar bugs.
2. Sugerir novas fontes de API.
3. Submeter **Pull Requests** com melhorias de performance ou UI.

---

<div align="center">
  <sub>Desenvolvido com ❤️ por Raphael Westim e a comunidade Waifu Vault</sub><br>
  <sub>Licenciado sob a MIT License</sub>
</div>
