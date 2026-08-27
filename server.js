require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const os = require('os');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Inicializa a conexão com a API do Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const PORT = 3000;

// Servir arquivos estáticos do diretório public
app.use(express.static(path.join(__dirname, 'public')));

// Função auxiliar para adicionar cabeçalho WAV a um buffer PCM bruto (16-bit mono 24kHz por padrão)
function addWavHeader(pcmBuffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16) {
  const byteLength = pcmBuffer.length;
  const header = Buffer.alloc(44);

  // Identificador RIFF
  header.write('RIFF', 0);
  // Tamanho do arquivo menos os 8 bytes iniciais
  header.writeUInt32LE(36 + byteLength, 4);
  // Formato WAVE
  header.write('WAVE', 8);
  // Identificador do sub-bloco de formato
  header.write('fmt ', 12);
  // Tamanho do sub-bloco de formato (16 para PCM linear)
  header.writeUInt32LE(16, 16);
  // Formato de áudio (1 = PCM linear)
  header.writeUInt16LE(1, 20);
  // Número de canais
  header.writeUInt16LE(numChannels, 22);
  // Taxa de amostragem (Sample Rate)
  header.writeUInt32LE(sampleRate, 24);
  // Taxa de bytes por segundo (Byte Rate)
  header.writeUInt32LE((sampleRate * bitsPerSample * numChannels) / 8, 28);
  // Alinhamento de bloco (Block Align)
  header.writeUInt16LE((bitsPerSample * numChannels) / 8, 32);
  // Bits por amostra (Bit Depth)
  header.writeUInt16LE(bitsPerSample, 34);
  // Identificador do sub-bloco de dados
  header.write('data', 36);
  // Tamanho do sub-bloco de dados (tamanho do PCM bruto)
  header.writeUInt32LE(byteLength, 40);

  return Buffer.concat([header, pcmBuffer]);
}

// Endpoint de Text-to-Speech usando Gemini Audio
app.get('/api/tts', async (req, res) => {
  const text = req.query.text;
  if (!text) {
    return res.status(400).send('Texto não informado.');
  }

  if (!process.env.GEMINI_API_KEY) {
    console.warn('Variável GEMINI_API_KEY não configurada no ambiente. Usando voz local.');
    return res.status(501).send('Chave do Gemini não configurada.');
  }

  // Permite configurar o modelo por variável de ambiente (padrão: gemini-2.5-flash-preview-tts)
  const modelName = process.env.GEMINI_TTS_MODEL || 'gemini-2.5-flash-preview-tts';

  try {
    const callPromise = ai.models.generateContent({
      model: modelName,
      contents: `Leia com uma voz profissional, pausada e clara de assistente virtual o seguinte texto: ${text}`,
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: "Aoede"
            }
          }
        }
      }
    });

    // Timeout aumentado para 30 segundos para dar tempo à API do Gemini de gerar o áudio
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Tempo limite (timeout) excedido na API do Gemini')), 100000)
    );

    const response = await Promise.race([callPromise, timeoutPromise]);

    const candidate = response.candidates?.[0];
    const part = candidate?.content?.parts?.[0];
    
    if (part && part.inlineData && part.inlineData.data) {
      const audioBase64 = part.inlineData.data;
      const rawAudioBuffer = Buffer.from(audioBase64, 'base64');
      
      // Adiciona o cabeçalho WAV para que o navegador consiga tocar o PCM bruto
      const wavBuffer = addWavHeader(rawAudioBuffer, 24000, 1, 16);

      res.set({
        'Content-Type': 'audio/wav',
        'Content-Length': wavBuffer.length
      });

      return res.send(wavBuffer);
    } else {
      throw new Error('Nenhum dado de áudio retornado pelo Gemini.');
    }
  } catch (error) {
    console.error("Erro ao gerar áudio com o Gemini:", error);
    res.status(500).send('Erro na síntese de voz.');
  }
});

// Estado global do painel mantido em memória no servidor
let globalState = {
  queue: [],
  nextNumbers: {
    'criminal-normal': 1,
    'criminal-prioridade': 1,
    'criminal-superprioridade': 1,
    'familia-normal': 1,
    'familia-prioridade': 1,
    'familia-superprioridade': 1,
    'execucao-penal-normal': 1,
    'execucao-penal-prioridade': 1,
    'execucao-penal-superprioridade': 1
  },
  currentTicket: null,
  history: [],
  desks: {}
};

io.on('connection', (socket) => {
  console.log(`Dispositivo conectado: ${socket.id}`);

  // Envia o estado atual do servidor ao conectar
  socket.emit('STATE_UPDATED', globalState);

  // Sincroniza o estado enviado por qualquer um dos clientes
  socket.on('SYNC_STATE', (newState) => {
    globalState = newState;
    // Broadcast para todos os outros clientes
    io.emit('STATE_UPDATED', globalState);
  });

  // Repassa a chamada física de senha para as telas (TV, operadores)
  socket.on('CALL_TICKET', ({ ticket, desk }) => {
    io.emit('CALL_TICKET', { ticket, desk });
  });

  // Repassa a rechamada de senha
  socket.on('RECALL_TICKET', ({ ticket, desk }) => {
    io.emit('RECALL_TICKET', { ticket, desk });
  });

  socket.on('disconnect', () => {
    console.log(`Dispositivo desconectado: ${socket.id}`);
  });
});

// Detectar IP da máquina na rede local
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const k in interfaces) {
    for (const k2 in interfaces[k]) {
      const address = interfaces[k][k2];
      if (address.family === 'IPv4' && !address.internal) {
        addresses.push(address.address);
      }
    }
  }
  return addresses.length > 0 ? addresses[0] : 'localhost';
}

server.listen(PORT, () => {
  const ip = getLocalIP();
  console.log('\n==================================================');
  console.log('SISTEMA DE PAINEL DE SENHAS INICIADO COM SUCESSO');
  console.log(`\n> Servidor rodando no computador local em: http://localhost:${PORT}`);
  console.log(`> Acesso por outros aparelhos na mesma rede: http://${ip}:${PORT}`);
  console.log('==================================================\n');
});
