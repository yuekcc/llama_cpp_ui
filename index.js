import * as markdown from 'markdown-wasm-es';

import { llama } from './completion';

const state = {
  id: 0,
  systemPrompt: '',
  config: {},
  history: {},
};

function formatMessage(prompt, response = '', systemPrompt = '') {
  let systemPrompt_ = systemPrompt ? `\n<<SYS>>${systemPrompt}<</SYS>>\n` : '';
  return `[INST]${systemPrompt_} ${prompt} [/INST]\n${response}`;
}

function formatVicunaMessage(prompt, response = '', systemPrompt = '') {
  return [systemPrompt, `USER: ${prompt}`, `ASSISTANT: ${response}`].join('\n');
}

function formatHistory(history) {
  const messages = Object.values(history).sort((a, b) => Number(a.id) - Number(b.id));
  return messages.map(m => formatMessage(m.prompt, m.response)).join('\n');
}

async function send(prompt, { systemPrompt = '', config = {}, writer }) {
  state.systemPrompt = systemPrompt;
  state.config = config || {};

  const finalPrompt = `${formatHistory(state.history)}${formatVicunaMessage(prompt, '', state.id === 0 ? systemPrompt : '')}`;

  const id = state.id++;
  state.history[id] = {
    id,
    prompt,
    response: '',
  };

  const request = llama(finalPrompt, { n_predict: -1, ...state.config });

  let response = '';
  for await (const chunk of request) {
    writer(chunk.data.content || '');
    response += chunk.data.content || '';
  }

  state.history[id].response = response;
}

const $ = document.querySelector.bind(document);

const systemPrompt = $('#system_prompt');
const prompt = $('#prompt');
const llmSettings = $('#llm_settings');

function parseJson(doc, defaultValue = null) {
  try {
    return JSON.parse(doc);
  } catch (e) {
    console.warn('#parseJson', e);
    return defaultValue;
  }
}

function div(className, ...children) {
  const element = document.createElement('div');
  element.className = className;
  element.append(...children);
  return element;
}

const messageContainer = document.querySelector('.message-container');

function makeMessageContainers() {
  const responseContent = div('content');
  const promptContent = div('content');
  const appendedContent = div('content');

  const message = div('message', div('prompt', promptContent), div('response', responseContent), div('appended', appendedContent));
  messageContainer.append(message);

  return { responseContent, promptContent, appendedContent };
}

function onSend() {
  const systemPrompt_ = systemPrompt.value.trim();
  const prompt_ = prompt.value.trim();
  const llmSettings_ = parseJson(llmSettings.value.trim());

  prompt.value = '';

  const { responseContent, promptContent, appendedContent } = makeMessageContainers();

  const writer = text => {
    responseContent._rawText += `${text || ''}`;
    responseContent.innerHTML = markdown.parse(responseContent._rawText || '');
    appendedContent.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  promptContent._rawText = prompt_;
  promptContent.innerHTML = markdown.parse(promptContent._rawText || '');
  send(prompt_, { systemPrompt: systemPrompt_, writer, config: llmSettings_ });
}

function exportHistory() {
  const content = Object.values(state.history)
    .sort((a, b) => Number(a.id) - Number(b.id))
    .map(it => [`## ${it.prompt}`.trim(), `${it.response}`.trim()].join('\n\n'))
    .join('\n\n');

  const blob = new File([content], '对话记录.md', { type: 'text/plain;charset=utf-8' });
  window.open(URL.createObjectURL(blob));
}

markdown.init().then(() => {
  $('#send').addEventListener('click', onSend);
  $('#prompt').addEventListener('keydown', evt => {
    if (evt.ctrlKey && evt.keyCode === 13) {
      onSend();
    }
  });

  $('#export_history').addEventListener('click', exportHistory);
});
