/* storage.js
   Every persistent read and write for ThreadSpire goes through this adapter, so a
   Wix CMS implementation can replace it later without touching the app. The
   default backs onto localStorage under one key. */
var ThreadSpireStorage = (function () {
  var KEY = 'THREADSPIRE_STATE';
  function blank() {
    return { discovered: [], pins: [], memorials: [], activeCharacter: null };
  }
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return blank();
      var s = JSON.parse(raw);
      return {
        discovered: Array.isArray(s.discovered) ? s.discovered : [],
        pins: Array.isArray(s.pins) ? s.pins : [],
        memorials: Array.isArray(s.memorials) ? s.memorials : [],
        activeCharacter: s.activeCharacter || null
      };
    } catch (e) { return blank(); }
  }
  function save(state) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }
  return { load: load, save: save, blank: blank };
})();
