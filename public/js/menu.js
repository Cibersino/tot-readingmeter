// public/js/menu.js
(function () {
  const registry = new Map();

  function registerMenuAction(payload, callback) {
    if (typeof payload !== 'string' || !payload.trim()) {
      throw new Error('registerMenuAction: payload debe ser string no vacío');
    }
    if (typeof callback !== 'function') {
      throw new Error('registerMenuAction: callback debe ser función');
    }
    registry.set(payload, callback);
    console.debug(`menuActions: acción registrada -> ${payload}`);
  }

  function unregisterMenuAction(payload) {
    return registry.delete(payload);
  }

  function listMenuActions() {
    return Array.from(registry.keys());
  }

  function handleMenuClick(payload) {
    console.log('menu-click recibido (menu.js):', payload);
    const action = registry.get(payload);
    if (action) {
      try { action(payload); } catch (err) { console.error(`Error ejecutando acción de menú '${payload}':`, err); }
    } else {
      console.warn(`menuActions: payload sin acción registrada -> ${payload}`);
    }
  }

  // Intenta registrar listener hacia preload -> ipcRenderer
  function setupListener() {
    if (window.electronAPI && typeof window.electronAPI.onMenuClick === 'function') {
      window.electronAPI.onMenuClick(handleMenuClick);
      console.debug('menuActions: listener registrado en electronAPI.onMenuClick');
      return true;
    }
    return false;
  }

  if (!setupListener()) {
    document.addEventListener('DOMContentLoaded', () => { setupListener(); });
  }

  // API pública mínima disponible globalmente
  window.menuActions = {
    registerMenuAction,
    unregisterMenuAction,
    listMenuActions
  };
})();
