import { marked } from 'marked';

import { llama } from './completion';
import { formatMessage } from './vicuna_prompt_template';

import './reset.css';
import './style.css';

const state = {
  id: 0,
  systemPrompt: '',
  config: {},
  history: {},
};

function formatHistory(history) {
  const messages = Object.values(history).sort((a, b) => Number(a.id) - Number(b.id));
  return messages.map(m => formatMessage(m.prompt, m.response)).join('\n');
}

async function send(prompt, { systemPrompt = '', config = {}, writer }) {
  state.systemPrompt = systemPrompt;
  state.config = config || {};

  const finalPrompt = `${formatHistory(state.history)}${formatMessage(prompt, '', state.id === 0 ? systemPrompt : '')}`;

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
    if (!responseContent._rawText) {
      responseContent._rawText = '';
    }

    responseContent._rawText += `${text || ''}`;
    responseContent.innerHTML = marked.parse(responseContent._rawText || '');
    appendedContent.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  promptContent._rawText = prompt_;
  promptContent.innerHTML = marked.parse(promptContent._rawText || '');
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

!(function () {
  $('#send').addEventListener('click', onSend);
  $('#prompt').addEventListener('keydown', evt => {
    if (evt.ctrlKey && evt.keyCode === 13) {
      onSend();
    }
  });

  $('#export_history').addEventListener('click', exportHistory);
})();
