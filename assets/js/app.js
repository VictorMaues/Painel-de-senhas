// Gerenciamento de Estado Compartilhado para o Sistema de Painel de Senhas

// Nome da chave usada para salvar os dados no localStorage do navegador
const DB_NAME = 'painel_senhas_db';

// Canal de transmissão (BroadcastChannel) para sincronização em tempo real entre diferentes abas.
// Se o navegador suportar, cria o canal chamado 'painel_senhas'. Caso contrário, define como null.
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('painel_senhas') : null;

// Estrutura de estado inicial do sistema
const defaultState = {
  queue: [], // Lista geral com todos os tickets (senhas) gerados, ativos e passados
  nextNumbers: {
    // Contadores sequenciais individuais para cada combinação de Vara e Prioridade
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
  currentTicket: null, // A senha que está sendo chamada na tela/painel principal no momento
  history: [], // Histórico das últimas 4 senhas chamadas anteriormente
  desks: {}, // Mapeamento dinâmico que guarda qual senha cada Guichê (1, 2, 3, etc.) está atendendo
  cycleIndex: 0 // Índice do ciclo de prioridade (0 a 4) para controle da sequência (S, S, P, P, C)
};

// Recupera o estado atualizado do banco de dados local (localStorage)
function getState() {
  const data = localStorage.getItem(DB_NAME);
  
  // Se não houver dados salvos ainda (primeira execução), inicializa com o estado padrão
  if (!data) {
    saveState(defaultState);
    return defaultState;
  }
  
  // Tenta converter o texto JSON de volta para objeto Javascript
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error("Falha ao analisar o estado local", e);
    return defaultState; // Retorna o estado padrão em caso de erro na leitura
  }
}

// Salva o estado no localStorage e notifica as outras abas abertas
function saveState(state) {
  // Salva no armazenamento local para não perder os dados ao atualizar a página
  localStorage.setItem(DB_NAME, JSON.stringify(state));
  
  // Se o canal de comunicação estiver ativo, envia o novo estado para as outras telas (TV, Totem, Operadores)
  if (channel) {
    channel.postMessage({ type: 'STATE_UPDATED', state });
  }
}

// Se inscreve para escutar atualizações de outras telas e executar uma função de retorno (callback)
function subscribeToUpdates(callback) {
  // Escuta mensagens enviadas através do BroadcastChannel
  if (channel) {
    channel.onmessage = (event) => {
      if (event.data && event.data.type === 'STATE_UPDATED') {
        callback(event.data.state); // Executa a renderização da tela com o novo estado
      }
    };
  }
  
  // Mecanismo de Fallback: Escuta o evento padrão 'storage' do navegador.
  // Isso garante que se uma aba alterar o localStorage, a outra aba também perceba a mudança mesmo sem o BroadcastChannel.
  window.addEventListener('storage', (event) => {
    if (event.key === DB_NAME) {
      try {
        callback(JSON.parse(event.newValue));
      } catch (e) {
        console.error("Erro ao processar evento de storage", e);
      }
    }
  });
}

// Gera um novo ticket/senha e o insere na fila de espera
function generateTicket(service, type) {
  const state = getState();
  const key = `${service}-${type}`; // Chave de busca do contador, ex: 'criminal-normal'
  
  // Recupera o número atual da senha e incrementa para a próxima emissão
  const num = state.nextNumbers[key] || 1;
  state.nextNumbers[key] = num + 1;

  // Define os prefixos da senha impressa:
  // C = Vara Criminal | F = Vara de Família | E = Execução Penal
  // N = Normal | P = Prioridade | S = Superprioridade
  let servicePrefix = 'E';
  if (service === 'criminal') servicePrefix = 'C';
  if (service === 'familia') servicePrefix = 'F';
  
  let typePrefix = 'N';
  if (type === 'prioridade') typePrefix = 'P';
  if (type === 'superprioridade') typePrefix = 'S';
  
  // Preenche a numeração com zeros à esquerda até obter 3 dígitos (ex: 1 vira '001')
  const paddedNum = String(num).padStart(3, '0');
  const code = `${servicePrefix}${typePrefix}-${paddedNum}`; // Exemplo final: "CP-005"

  // Estrutura do objeto da Senha
  const newTicket = {
    id: `${code}-${Date.now()}`, // Identificador único gerado combinando código e timestamp
    code: code, // Código legível exibido no painel
    service: service, // Serviço ('criminal', 'familia' ou 'execucao-penal')
    type: type, // Tipo de atendimento ('normal', 'prioridade', 'superprioridade')
    status: 'waiting', // Status inicial: aguardando atendimento
    createdAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) // Hora de criação formatada (HH:MM)
  };

  state.queue.push(newTicket); // Adiciona na fila geral
  saveState(state); // Salva as alterações
  return newTicket;
}

// Chamar uma senha específica para um Guichê determinado
function callTicket(ticketId, desk) {
  const state = getState();
  const ticketIndex = state.queue.findIndex(t => t.id === ticketId);
  
  // Se a senha não for encontrada na fila, aborta a operação
  if (ticketIndex === -1) return null;

  const ticket = state.queue[ticketIndex];
  
  // Se esta mesma senha já estiver sendo chamada e o operador clicou em rechamar,
  // apenas envia o evento de rechamada sem alterar o histórico ou mudar o estado
  if (state.currentTicket && state.currentTicket.id === ticketId) {
    if (channel) {
      channel.postMessage({ type: 'RECALL_TICKET', ticket: state.currentTicket, desk });
    }
    return ticket;
  }

  // Atualiza a senha que estava ativa anteriormente para o histórico
  if (state.currentTicket) {
    // Insere a senha antiga no início do histórico e limita a lista às últimas 4 posições
    state.history = [state.currentTicket, ...state.history.filter(h => h.id !== state.currentTicket.id)].slice(0, 4);
  }

  // Atualiza as informações do ticket chamado com o guichê e horário
  ticket.status = 'called';
  ticket.desk = desk;
  ticket.calledAt = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  
  // Define o ticket como a chamada principal ativa
  state.currentTicket = ticket;
  state.desks[desk] = ticket; // Vincula a senha atual ao guichê correspondente

  // Atualiza o registro da senha dentro da fila de controle
  state.queue[ticketIndex] = ticket;

  // Salva no banco de dados e notifica outras abas com a mudança do estado geral
  saveState(state);

  // Dispara um evento específico de chamada para que a TV/Painel toque o som do gongo e fale a senha (TTS)
  if (channel) {
    channel.postMessage({ type: 'CALL_TICKET', ticket, desk });
  }

  return ticket;
}

// Reseta o estado completo do painel (limpa filas e reinicia os contadores de senhas)
function resetState() {
  saveState(defaultState);
}
