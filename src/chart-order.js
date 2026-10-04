export function moveItem(keys, from, to) {
  const next = [...keys];
  if (from < 0 || to < 0 || from >= next.length || to >= next.length) return next;
  next.splice(to, 0, next.splice(from, 1)[0]);
  return next;
}

export function orderedKeys(current, saved = []) {
  return [...saved.filter((key, i) => current.includes(key) && saved.indexOf(key) === i), ...current.filter(key => !saved.includes(key))];
}

export function enableChartOrdering(root, page) {
  let preferences = {};
  try { preferences = JSON.parse(localStorage.getItem("pmp-chart-order") || "{}"); } catch { /* Defaults remain usable. */ }
  const parents = new Set([...root.querySelectorAll(".auto-fit-component")].map(w => w.parentElement));
  parents.forEach(parent => {
    const wrappers = [...parent.children].filter(w => w.classList.contains("auto-fit-component"));
    if (wrappers.length < 2) return;
    const scope = `${page}:${parent.closest("[data-layout-scope]")?.dataset.layoutScope || "page"}`;
    const defaults = wrappers.map(w => w.dataset.layoutKey);
    const map = new Map(wrappers.map(w => [w.dataset.layoutKey, w]));
    let keys = orderedKeys(defaults, Array.isArray(preferences[scope]) ? preferences[scope] : []);
    const status = document.createElement("span");
    status.className = "sr-only";
    status.setAttribute("role", "status");
    parent.append(status);
    const apply = (save = true) => {
      keys.forEach(key => parent.append(map.get(key)));
      if (save) {
        preferences[scope] = keys;
        try { localStorage.setItem("pmp-chart-order", JSON.stringify(preferences)); } catch { /* Keep the current layout in this view. */ }
      }
    };
    wrappers.forEach(wrapper => {
      const component = wrapper.querySelector(".panel");
      const title = component.querySelector("h2")?.textContent || "chart";
      const move = to => {
        const from = keys.indexOf(wrapper.dataset.layoutKey);
        keys = moveItem(keys, from, to);
        apply();
        status.textContent = `${title}: position ${keys.indexOf(wrapper.dataset.layoutKey) + 1} of ${keys.length}`;
      };
      const handle = document.createElement("button");
      handle.type = "button";
      handle.className = "chart-title-move";
      handle.textContent = title;
      handle.setAttribute("aria-label", `Move panel: ${title}`);
      handle.addEventListener("click", e => { e.preventDefault(); e.stopPropagation(); });
      handle.title = "Drag to reorder. Arrow keys move; Home restores the default order.";
      handle.addEventListener("keydown", e => {
        if (["ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight", "Home"].includes(e.key)) {
          e.preventDefault();
          e.stopPropagation();
          if (e.key === "Home") { keys = [...defaults]; apply(); status.textContent = "Default chart order restored."; }
          else move(keys.indexOf(wrapper.dataset.layoutKey) + (["ArrowUp", "ArrowLeft"].includes(e.key) ? -1 : 1));
          handle.focus({ preventScroll: true });
        }
      });
      let dragging = false;
      handle.addEventListener("pointerdown", e => {
        if (e.button !== 0) return;
        e.preventDefault(); e.stopPropagation();
        dragging = true;
        handle.setPointerCapture(e.pointerId);
        wrapper.classList.add("chart-moving");
      });
      handle.addEventListener("pointermove", e => {
        if (!dragging) return;
        const target = document.elementFromPoint(e.clientX, e.clientY)?.closest(".auto-fit-component");
        parent.querySelectorAll(".chart-drop-target").forEach(w => w.classList.remove("chart-drop-target"));
        if (target && target !== wrapper && target.parentElement === parent) target.classList.add("chart-drop-target");
        if (e.clientY < 80) window.scrollBy(0, -24);
        if (e.clientY > innerHeight - 80) window.scrollBy(0, 24);
      });
      const finish = (e, cancel = false) => {
        if (!dragging) return;
        dragging = false;
        const target = document.elementFromPoint(e.clientX, e.clientY)?.closest(".auto-fit-component");
        wrapper.classList.remove("chart-moving");
        parent.querySelectorAll(".chart-drop-target").forEach(w => w.classList.remove("chart-drop-target"));
        if (!cancel && target && target !== wrapper && target.parentElement === parent) move(keys.indexOf(target.dataset.layoutKey));
        handle.focus({ preventScroll: true });
      };
      handle.addEventListener("pointerup", e => finish(e));
      handle.addEventListener("pointercancel", e => finish(e, true));
      // A native title button separates moving from the existing collapse action.
      const heading = component.querySelector("h2");
      heading?.setAttribute("aria-label", title);
      heading?.replaceChildren(handle);
    });
    apply(false);
  });
}
