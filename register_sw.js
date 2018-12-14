/**
 * Register a service worker for caching static assets.
 */
if (navigator.serviceWorker) {
  navigator.serviceWorker.register('./serviceworker.js').then(function(reg) {
    console.log("Service Worker Registered", reg);
  }).catch(function(err) {
    console.log("Service Worker failed to register", err);
  });
  /**
 * Register a service worker for Offline sync.
 */
   navigator.serviceWorker.ready.then(function (reg) {
      console.log('Service Worker Ready');
      // Request a one-off sync
      return reg.sync.register('restaurantReviewsOffline');
    }).catch(function (err) {
      // System was unable to register for a sync,
      console.log(err);
	});
} else {
    console.log('Serviceworker not supported');
  }
