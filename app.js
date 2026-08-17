// Shared State Management for Password Panel System
const DB_NAME = 'painel_senhas_db';
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('painel_senhas') : null;

// Initial state structure
const defaultState = {
  queue: [], // All active and past tickets
  nextNumbers: {
    'criminal-normal': 1,
    'criminal-prioridade': 1,
    'familia-normal': 1,
    'familia-prioridade': 1
  },
  currentTicket: null, // Ticket currently on the screen/being called
  history: [], // Last 5 called tickets
  desks: {} // Map of operator Desk -> ticket currently being served
};

// Load state from localStorage
function getState() {
  const data = localStorage.getItem(DB_NAME);
  if (!data) {
    saveState(defaultState);
    return defaultState;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error("Failed to parse state", e);
    return defaultState;
  }
}

// Save state to localStorage and notify other tabs
function saveState(state) {
  localStorage.setItem(DB_NAME, JSON.stringify(state));
  if (channel) {
    channel.postMessage({ type: 'STATE_UPDATED', state });
  }
}

// Subscribe to state updates
function subscribeToUpdates(callback) {
  if (channel) {
    channel.onmessage = (event) => {
      if (event.data && event.data.type === 'STATE_UPDATED') {
        callback(event.data.state);
      }
    };
  }
  // Fallback / support for standard storage event
  window.addEventListener('storage', (event) => {
    if (event.key === DB_NAME) {
      try {
        callback(JSON.parse(event.newValue));
      } catch (e) {
        console.error("Storage event parse failed", e);
      }
    }
  });
}

// Generate new ticket
function generateTicket(service, type) {
  const state = getState();
  const key = `${service}-${type}`;
  const num = state.nextNumbers[key] || 1;
  state.nextNumbers[key] = num + 1;

  // Prefix based on service and type
  // C = Criminal, F = Família
  // N = Normal, P = Prioridade
  const servicePrefix = service === 'criminal' ? 'C' : 'F';
  const typePrefix = type === 'normal' ? 'N' : 'P';
  const paddedNum = String(num).padStart(3, '0');
  const code = `${servicePrefix}${typePrefix}-${paddedNum}`;

  const newTicket = {
    id: `${code}-${Date.now()}`,
    code: code,
    service: service,
    type: type,
    status: 'waiting',
    createdAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  };

  state.queue.push(newTicket);
  saveState(state);
  return newTicket;
}

// Call next/specific ticket
function callTicket(ticketId, desk) {
  const state = getState();
  const ticketIndex = state.queue.findIndex(t => t.id === ticketId);
  
  if (ticketIndex === -1) return null;

  const ticket = state.queue[ticketIndex];
  
  // If the ticket was already current, just re-announce it
  if (state.currentTicket && state.currentTicket.id === ticketId) {
    if (channel) {
      channel.postMessage({ type: 'RECALL_TICKET', ticket: state.currentTicket, desk });
    }
    return ticket;
  }

  // Update previous current ticket to history if exists
  if (state.currentTicket) {
    // Add to history, keep only top 4
    state.history = [state.currentTicket, ...state.history.filter(h => h.id !== state.currentTicket.id)].slice(0, 4);
  }

  ticket.status = 'called';
  ticket.desk = desk;
  ticket.calledAt = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  
  state.currentTicket = ticket;
  state.desks[desk] = ticket;

  // Remove called ticket from queue or update status
  state.queue[ticketIndex] = ticket;

  saveState(state);

  // Broadcast specific call event for text-to-speech triggering
  if (channel) {
    channel.postMessage({ type: 'CALL_TICKET', ticket, desk });
  }

  return ticket;
}

// Reset/Clean State
function resetState() {
  saveState(defaultState);
}
