const DB_NAME = "painel_senhas_db";

const channel =
  typeof BroadcastChannel !== "undefined"
    ? new BroadcastChannel("painel_senhas")
    : null;

const defaultState = {
  queue: [],
  nextNumbers: {
    "criminal-normal": 1,
    "criminal-prioridade": 1,
    "criminal-superprioridade": 1,
    "familia-normal": 1,
    "familia-prioridade": 1,
    "familia-superprioridade": 1,
    "execucao-penal-normal": 1,
    "execucao-penal-prioridade": 1,
    "execucao-penal-superprioridade": 1,
  },
  currentTicket: null,
  history: [],
  desks: {},
  cycleIndex: 0,
};

// Conectar ao servidor via WebSocket se a biblioteca estiver disponível (modo rede)
const socket = typeof io !== 'undefined' ? io() : null;
let serverState = null;
let stateChangeCallback = null;

if (socket) {
  console.log("Conectado ao servidor do painel via WebSockets (modo rede)");
  
  // Escutar atualizações do servidor
  socket.on('STATE_UPDATED', (state) => {
    serverState = state;
    localStorage.setItem(DB_NAME, JSON.stringify(state));
    
    // Notifica os escutas locais da página
    if (stateChangeCallback) {
      stateChangeCallback(state);
    }
    // Sincroniza abas locais se houver
    if (channel) {
      channel.postMessage({ type: "STATE_UPDATED", state });
    }
  });

  // Escutar eventos específicos de chamadas (para reprodução de áudio/voz na TV)
  socket.on('CALL_TICKET', ({ ticket, desk }) => {
    if (channel) {
      channel.postMessage({ type: "CALL_TICKET", ticket, desk });
    }
  });

  socket.on('RECALL_TICKET', ({ ticket, desk }) => {
    if (channel) {
      channel.postMessage({ type: "RECALL_TICKET", ticket, desk });
    }
  });
}

function getState() {
  if (socket && serverState) {
    return serverState;
  }
  const data = localStorage.getItem(DB_NAME);

  if (!data) {
    saveState(defaultState);
    return defaultState;
  }

  try {
    return JSON.parse(data);
  } catch (e) {
    console.error("Falha ao analisar o estado local", e);
    return defaultState;
  }
}

function saveState(state) {
  if (socket) {
    socket.emit('SYNC_STATE', state);
  } else {
    localStorage.setItem(DB_NAME, JSON.stringify(state));
    if (channel) {
      channel.postMessage({ type: "STATE_UPDATED", state });
    }
  }
}

function subscribeToUpdates(callback) {
  stateChangeCallback = callback;

  if (channel) {
    channel.onmessage = (event) => {
      if (event.data) {
        if (event.data.type === "STATE_UPDATED") {
          callback(event.data.state);
        } else if (event.data.type === "CALL_TICKET" && typeof playChime !== 'undefined') {
          // Trata eventos locais de som se estiver rodando localmente
          const { ticket, desk } = event.data;
          updateDisplay(getState());
          animateCall();
          playChime();
          announceTicket(ticket, desk);
        } else if (event.data.type === "RECALL_TICKET" && typeof playChime !== 'undefined') {
          const { ticket, desk } = event.data;
          animateCall();
          playChime();
          announceTicket(ticket, desk);
        }
      }
    };
  }

  window.addEventListener("storage", (event) => {
    if (event.key === DB_NAME) {
      try {
        callback(JSON.parse(event.newValue));
      } catch (e) {
        console.error("Erro ao processar evento de storage", e);
      }
    }
  });
}

function generateTicket(service, type) {
  const state = getState();
  const key = `${service}-${type}`;
  const num = state.nextNumbers[key] || 1;
  state.nextNumbers[key] = num + 1;

  let servicePrefix = "E";
  if (service === "criminal") servicePrefix = "C";
  if (service === "familia") servicePrefix = "F";

  let typePrefix = "N";
  if (type === "prioridade") typePrefix = "P";
  if (type === "superprioridade") typePrefix = "S";

  const paddedNum = String(num).padStart(3, "0");
  const code = `${servicePrefix}${typePrefix}-${paddedNum}`;
  const newTicket = {
    id: `${code}-${Date.now()}`,
    code: code,
    service: service,
    type: type,
    status: "waiting",
    createdAt: new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };

  state.queue.push(newTicket);
  saveState(state);
  return newTicket;
}

function callTicket(ticketId, desk) {
  const state = getState();
  const ticketIndex = state.queue.findIndex((t) => t.id === ticketId);

  if (ticketIndex === -1) return null;

  const ticket = state.queue[ticketIndex];
  if (state.currentTicket && state.currentTicket.id === ticketId) {
    if (socket) {
      socket.emit('RECALL_TICKET', { ticket: state.currentTicket, desk });
    } else if (channel) {
      channel.postMessage({
        type: "RECALL_TICKET",
        ticket: state.currentTicket,
        desk,
      });
    }
    return ticket;
  }

  if (state.currentTicket) {
    state.history = [
      state.currentTicket,
      ...state.history.filter((h) => h.id !== state.currentTicket.id),
    ].slice(0, 4);
  }

  ticket.status = "called";
  ticket.desk = desk;
  ticket.calledAt = new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  state.currentTicket = ticket;
  state.desks[desk] = ticket;
  state.queue[ticketIndex] = ticket;

  if (socket) {
    socket.emit('SYNC_STATE', state);
    socket.emit('CALL_TICKET', { ticket, desk });
  } else {
    saveState(state);
    if (channel) {
      channel.postMessage({ type: "CALL_TICKET", ticket, desk });
    }
  }

  return ticket;
}

function resetState() {
  saveState(defaultState);
}
