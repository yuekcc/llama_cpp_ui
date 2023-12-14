export function formatMessage(prompt, response = '', systemPrompt = '') {
  let systemPrompt_ = systemPrompt ? `\n<<SYS>>${systemPrompt}<</SYS>>\n` : '';
  return `[INST]${systemPrompt_} ${prompt} [/INST]\n${response}`;
}
