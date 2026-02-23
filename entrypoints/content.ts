export default defineContentScript({
  matches: ['*://*/*'],
  runAt: 'document_idle',
  main() {
    let isDirty = false;

    function beforeUnloadHandler(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = '';
    }

    function enableGuard() {
      if (!isDirty) {
        isDirty = true;
        window.addEventListener('beforeunload', beforeUnloadHandler);
      }
    }

    function disableGuard() {
      isDirty = false;
      window.removeEventListener('beforeunload', beforeUnloadHandler);
    }

    function watchFormElement(el: Element) {
      if (el instanceof HTMLInputElement) {
        const type = el.type?.toLowerCase();
        if (type === 'hidden' || type === 'submit') return;
      }

      el.addEventListener('input', enableGuard, { once: false });
      el.addEventListener('change', enableGuard, { once: false });
    }

    function watchForm(form: HTMLFormElement) {
      form.addEventListener('submit', disableGuard);
      form.addEventListener('reset', disableGuard);
    }

    function scanForms() {
      document.querySelectorAll('input, textarea, select').forEach(watchFormElement);
      document.querySelectorAll('form').forEach((form) => watchForm(form as HTMLFormElement));
    }

    scanForms();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLElement) {
            node.querySelectorAll('input, textarea, select').forEach(watchFormElement);
            node.querySelectorAll('form').forEach((form) => watchForm(form as HTMLFormElement));

            if (node.matches('input, textarea, select')) {
              watchFormElement(node);
            }
            if (node.matches('form')) {
              watchForm(node as HTMLFormElement);
            }
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      disableGuard();
    };
  },
});
