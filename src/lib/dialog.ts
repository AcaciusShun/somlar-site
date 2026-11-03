/** Preserve the document's place while a native dialog owns the viewport. */
export function createDialogController(dialog: HTMLDialogElement) {
  let trigger: HTMLElement | null = null;
  let restoreScroll: (() => void) | undefined;

  const restore = () => {
    restoreScroll?.();
    restoreScroll = undefined;
    if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    trigger = null;
  };
  dialog.addEventListener("close", restore);

  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right ||
        event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });

  return {
    open(from: HTMLElement) {
      if (dialog.open) return;
      trigger = from;
      const y = window.scrollY;
      const x = window.scrollX;
      const body = document.body;
      const saved = {
        position: body.style.position, top: body.style.top, left: body.style.left,
        width: body.style.width, overflow: document.documentElement.style.overflow,
      };
      dialog.showModal();
      document.documentElement.style.overflow = "hidden";
      body.style.position = "fixed";
      body.style.top = -y + "px";
      body.style.left = -x + "px";
      body.style.width = "100%";
      restoreScroll = () => {
        Object.assign(body.style, {
          position: saved.position, top: saved.top, left: saved.left, width: saved.width,
        });
        document.documentElement.style.overflow = saved.overflow;
        window.scrollTo(x, y);
      };
    },
    close() {
      dialog.close();
      restore();
    },
  };
}
