export function formatMessage(prompt, response = '', systemPrompt = '') {
  return [systemPrompt, `User: ${prompt}`, `Assistant: ${response}`].join('\n');
}
