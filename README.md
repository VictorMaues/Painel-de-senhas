# Painel de Senhas - Defensoria

Um sistema completo de gerenciamento de filas e chamadas de senhas com suporte a múltiplas categorias, prioridades e síntese de voz (TTS) utilizando o Google Tradutor.

## 🚀 Funcionalidades

- **Múltiplas Categorias:** Suporte para filas independentes (ex: Criminal, Família, Execução Penal).
- **Níveis de Prioridade:** Filas normais, prioritárias e superprioritárias.
- **Sincronização em Tempo Real:** Telas e painéis sincronizados instantaneamente utilizando `Socket.io`.
- **Chamada por Voz (TTS):** Integração com a API do Google TTS Gratuito para realizar a leitura das senhas chamadas com voz natural.
- **Acesso em Rede Local:** Pode ser acessado por qualquer dispositivo (computadores, Smart TVs, tablets, celulares) que estejam conectados na mesma rede Wi-Fi/cabo.

## 🛠️ Tecnologias Utilizadas

- **Node.js** (Ambiente de execução)
- **Express.js** (Servidor Web para rotas e arquivos estáticos)
- **Socket.io** (Comunicação em tempo real via WebSockets)
- **Google TTS API (`google-tts-api`)** (Para geração do áudio das chamadas sem necessidade de chaves e sem limites rígidos)
- **Dotenv** (Gerenciamento de variáveis de ambiente - *Opcional neste novo modelo*)

## ⚙️ Pré-requisitos

Antes de iniciar, certifique-se de ter instalado em sua máquina:
- [Node.js](https://nodejs.org/) (versão 18 ou superior recomendada)

## 📦 Instalação

Abra o terminal na pasta raiz do projeto e instale as dependências executando o comando abaixo:

```bash
npm install
```

*(Opcional) A chave de API no arquivo `.env` não é mais necessária para o funcionamento da voz, pois o sistema atual utiliza a via gratuita.*

## 🚀 Como Executar o Projeto

Após instalar as dependências, inicie o servidor:

```bash
npm start
```

No seu terminal, você verá uma tela semelhante a esta:

```text
==================================================
SISTEMA DE PAINEL DE SENHAS INICIADO COM SUCESSO

> Servidor rodando no computador local em: http://localhost:3000
> Acesso por outros aparelhos na mesma rede: http://192.168.0.X:3000
==================================================
```

### 📺 Como usar nas telas
1. **No computador que está rodando o servidor (Local):** Acesse `http://localhost:3000`.
2. **Na TV do salão de espera ou em computadores de outros atendentes:** Abra o navegador, conecte-se à mesma rede, e acesse o IP de rede mostrado no terminal (ex: `http://10.85.225.106:3000`).
