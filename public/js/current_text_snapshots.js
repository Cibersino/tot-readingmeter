// public/js/current_text_snapshots.js
'use strict';

// =============================================================================
// Overview
// =============================================================================
// Responsibilities:
// - Wire main-window snapshot buttons (Save / Load).
// - Call preload IPC methods for save/load via native dialogs.
// - Surface success/failure notifications to the user.

(() => {
  const log = window.getLogger('current-text-snapshots-ui');
  let initialized = false;

  function notifyMain(notifyApi, key) {
    if (notifyApi && typeof notifyApi.notifyMain === 'function') {
      notifyApi.notifyMain(key);
      return;
    }
    alert(key);
  }

  function toastMain(notifyApi, key) {
    if (notifyApi && typeof notifyApi.toastMain === 'function') {
      notifyApi.toastMain(key);
      return;
    }
    notifyMain(notifyApi, key);
  }

  function init({
    guardUserAction = null,
    electronAPI = null,
    notify = null,
  } = {}) {
    if (initialized) return true;

    const btnLoad = document.getElementById('btnLoadSnapshot');
    const btnSave = document.getElementById('btnSaveSnapshot');
    if (!btnLoad || !btnSave) {
      log.warnOnce(
        'current_text_snapshots_ui.buttons.missing',
        '[current_text_snapshots_ui] Snapshot buttons missing; wiring skipped.'
      );
      return false;
    }

    if (
      !electronAPI ||
      typeof electronAPI.saveCurrentTextSnapshotViaDialog !== 'function' ||
      typeof electronAPI.loadCurrentTextSnapshotViaDialog !== 'function'
    ) {
      log.warnOnce(
        'current_text_snapshots_ui.api.missing',
        '[current_text_snapshots_ui] Snapshot API missing in preload; wiring skipped.'
      );
      return false;
    }

    const canRun = (actionId) => {
      if (typeof guardUserAction !== 'function') return true;
      return !!guardUserAction(actionId);
    };

    btnSave.addEventListener('click', async () => {
      if (!canRun('snapshot-save')) return;
      try {
        const res = await electronAPI.saveCurrentTextSnapshotViaDialog();
        if (res && res.ok) {
          toastMain(notify, 'renderer.alerts.snapshot_saved');
          return;
        }
        if (res && res.code === 'CANCELLED') return;
        if (res && res.code === 'OUTSIDE_SNAPSHOTS_DIR') {
          notifyMain(notify, 'renderer.alerts.snapshot_outside');
          return;
        }
        notifyMain(notify, 'renderer.alerts.snapshot_save_error');
      } catch (err) {
        log.error('[current_text_snapshots_ui] save failed:', err);
        notifyMain(notify, 'renderer.alerts.snapshot_save_error');
      }
    });

    btnLoad.addEventListener('click', async () => {
      if (!canRun('snapshot-load')) return;
      try {
        const res = await electronAPI.loadCurrentTextSnapshotViaDialog();
        if (res && res.ok) {
          if (res.truncated) {
            toastMain(notify, 'renderer.alerts.snapshot_loaded_truncated');
          } else {
            toastMain(notify, 'renderer.alerts.snapshot_loaded');
          }
          return;
        }
        if (res && res.code === 'CANCELLED') return;
        if (res && res.code === 'OUTSIDE_SNAPSHOTS_DIR') {
          notifyMain(notify, 'renderer.alerts.snapshot_outside');
          return;
        }
        if (res && (res.code === 'INVALID_JSON' || res.code === 'INVALID_SCHEMA')) {
          notifyMain(notify, 'renderer.alerts.snapshot_invalid_file');
          return;
        }
        notifyMain(notify, 'renderer.alerts.snapshot_load_error');
      } catch (err) {
        log.error('[current_text_snapshots_ui] load failed:', err);
        notifyMain(notify, 'renderer.alerts.snapshot_load_error');
      }
    });

    initialized = true;
    return true;
  }

  window.CurrentTextSnapshotsUI = { init };
})();

