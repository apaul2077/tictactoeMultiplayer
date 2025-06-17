import { chatSection } from './dom.js';

export function toggleChatVisibility(show) {
  chatSection.style.display = show ? 'flex' : 'none';
}

export function appendChatMessage(msg) {
  const msgEl = document.createElement('p');
  msgEl.textContent = msg;
  document.getElementById('chatContainer').appendChild(msgEl);
  document.getElementById('chatContainer').scrollTop = document.getElementById('chatContainer').scrollHeight;
}
