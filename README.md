# Painel de Senhas - Defensoria

Um sistema completo de gerenciamento de filas e chamadas de senhas com suporte a múltiplas categorias, prioridades e síntese de voz (TTS) utilizando a Inteligência Artificial do Google Gemini.

## 🚀 Funcionalidades

- **Múltiplas Categorias:** Suporte para filas independentes (ex: Criminal, Família, Execução Penal).
- **Níveis de Prioridade:** Filas normais, prioritárias e superprioritárias.
- **Sincronização em Tempo Real:** Telas e painéis sincronizados instantaneamente utilizando `Socket.io`.
- **Chamada por Voz (TTS):** Integração com a API do Google Gemini para realizar a leitura das senhas chamadas com voz natural de assistente virtual.
- **Acesso em Rede Local:** Pode ser acessado por qualquer dispositivo (computadores, Smart TVs, tablets, celulares) que estejam conectados na mesma rede Wi-Fi/cabo.

## 🛠️ Tecnologias Utilizadas

- **Node.js** (Ambiente de execução)
- **Express.js** (Servidor Web para rotas e arquivos estáticos)
- **Socket.io** (Comunicação em tempo real via WebSockets)
- **Google Gen AI SDK (`@google/genai`)** (Para geração do áudio das chamadas - Text-to-Speech)
- **Dotenv** (Gerenciamento de variáveis de ambiente)

## ⚙️ Pré-requisitos

Antes de iniciar, certifique-se de ter instalado em sua máquina:
- [Node.js](https://nodejs.org/) (versão 18 ou superior recomendada)

Você também precisará de uma chave de API do **Google AI Studio** para habilitar o recurso de chamada por voz (se não for configurado, o sistema apenas não emitirá o áudio gerado pelo Gemini).

## 📦 Instalação

Abra o terminal na pasta raiz do projeto e instale as dependências executando o comando abaixo:

```bash
npm install
```

## 🔑 Configuração do Ambiente

Para que a geração de voz funcione corretamente, configure sua chave de API:

1. Na raiz do projeto, verifique se o arquivo `.env` foi criado. Se não, você pode criar um a partir do arquivo `.env.example`.
2. Abra o arquivo `.env`.
3. Adicione sua chave gerada no [Google AI Studio](https://aistudio.google.com/):

```env
GEMINI_API_KEY=sua_chave_real_aqui
```

> **Aviso de Quota (Limites de Uso):** Se você estiver utilizando a camada gratuita (Free Tier) do Google AI Studio, existe um limite de chamadas por minuto/dia. Caso esse limite seja atingido, as senhas podem falhar ao gerar áudio temporariamente (Erro 429 - Quota Exceeded), sendo necessário aguardar alguns segundos ou migrar para o plano *Pay-as-you-go*.

## 🚀 Como Executar o Projeto

Após instalar as dependências e configurar as variáveis, inicie o servidor:

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
