const CLIPBOARD_TIMEOUT_MS = 900;

function writeWithClipboardApi(text) {
  const writeText = globalThis.navigator?.clipboard?.writeText?.bind(globalThis.navigator.clipboard);
  if (!writeText) return Promise.reject(new Error('Clipboard API unavailable'));

  return Promise.race([
    writeText(text),
    new Promise((_, reject) => {
      globalThis.window?.setTimeout(() => reject(new Error('Clipboard write timeout')), CLIPBOARD_TIMEOUT_MS);
    }),
  ]);
}

function writeWithTextareaFallback(text) {
  if (!globalThis.document?.body) throw new Error('Clipboard fallback unavailable');

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '0';
  textarea.style.left = '-9999px';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);
  const copied = document.execCommand('copy');
  document.body.removeChild(textarea);

  if (!copied) throw new Error('Clipboard fallback failed');
}

export async function copyTextToClipboard(text) {
  if (!text) return false;

  try {
    await writeWithClipboardApi(text);
    return true;
  } catch {
    writeWithTextareaFallback(text);
    return true;
  }
}
