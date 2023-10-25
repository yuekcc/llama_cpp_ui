import { llama } from '/completion.js';

const state = {
  id: 0,
  systemPrompt: '',
  config: {},
  history: {},
};

function formatMessage(prompt, response = '', systemPrompt = '') {
  let systemPrompt_ = systemPrompt ? `<<SYS>>${systemPrompt}<</SYS>>` : '';
  return ` [INST]${systemPrompt_} ${prompt} [/INST]${response}`;
}

function formatHistory(history) {
  const messages = Object.values(history).sort((a, b) => Number(a.id) - Number(b.id));
  return messages.map(m => formatMessage(m.prompt, m.response)).join('\n');
}

export async function send(prompt, { systemPrompt = '', config = {}, writer }) {
  state.systemPrompt = systemPrompt;
  state.config = config || {};

  console.log(state);
  const finalPrompt = `${formatHistory(state.history)}${formatMessage(prompt, '', state.id === 0 ? systemPrompt : '')}`;
  console.log(finalPrompt);
  console.log(state);

  const id = state.id++;
  state.history[id] = {
    id,
    prompt,
    response: '',
  };

  const request = llama(finalPrompt, { n_predict: 800, ...state.config });

  let response = '';
  for await (const chunk of request) {
    writer(chunk.data.content);
    response += chunk.data.content;
  }

  state.history[id].response = response;
}
