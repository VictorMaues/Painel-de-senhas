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

## 🛠️ Passo a Passo para Executar o Projeto

Siga os comandos abaixo no terminal do seu computador (PowerShell, CMD ou terminal do VS Code) dentro da pasta raiz do projeto:

### 1. Instalar as dependências do projeto
Este comando instala todas as bibliotecas necessárias (como `google-tts-api` e `socket.io`) especificadas no `package.json`:
```bash
npm install
```

### 2. Iniciar o servidor do painel
Este comando inicia o servidor do painel de senhas em tempo real:
```bash
npm start
```

---

## 🚀 O que acontece após a execução?

Ao rodar `npm start`, você verá a seguinte mensagem no seu terminal:

```text
==================================================
SISTEMA DE PAINEL DE SENHAS INICIADO COM SUCESSO

> Servidor rodando no computador local em: http://localhost:3000
> Acesso por outros aparelhos na mesma rede: http://192.168.0.X:3000
==================================================
```

### 📺 Como acessar as telas
1. **No computador que está rodando o servidor (Local):** Acesse `http://localhost:3000` para abrir o painel principal de atendimento/configuração.
2. **Na TV da sala de espera ou nos computadores dos demais operadores:** Abra o navegador, conecte à mesma rede (Wi-Fi ou cabo) do servidor, e acesse o IP de rede mostrado no terminal (ex: `http://192.168.0.X:3000`).
