/**
 * Register a service worker for caching static assets.
 */
if (navigator.serviceWorker) {
  navigator.serviceWorker.register('./serviceworker.js').then(function(reg) {
    console.log("Service Worker Registered", reg);
  }).catch(function(err) {
    console.log("Service Worker failed to register", err);
  });
}