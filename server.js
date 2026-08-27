require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const os = require('os');
const googleTTS = require('google-tts-api');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;

// Servir arquivos estáticos do diretório public
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint de Text-to-Speech usando Google TTS Gratuito
app.get('/api/tts', async (req, res) => {
  const text = req.query.text;
  if (!text) {
    return res.status(400).send('Texto não informado.');
  }

  try {
    // getAudioBase64 returns base64 string of the MP3 audio
    const base64Audio = await googleTTS.getAudioBase64(text, {
      lang: 'pt',
      slow: false,
      host: 'https://translate.google.com',
      timeout: 10000,
    });
    
    const audioBuffer = Buffer.from(base64Audio, 'base64');
    res.set({
      'Content-Type': 'audio/mp3',
      'Content-Length': audioBuffer.length
    });
    return res.send(audioBuffer);
  } catch (error) {
    console.error("Erro no TTS gratuito:", error);
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
