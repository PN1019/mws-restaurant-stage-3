const staticCacheName = 'restaurant-reviews-v4';
var imgCache = 'restaurant-img';

var filesToCache=[
	    './',
        './index.html',
        './restaurant.html',
		'./offline.html',   
		'./manifest.json',
		// Remove resturants.json from cache as  data is  coming from server.
        './css/styles.css',
		'./js/dbhelper.js',
		'./js/main.js',
        './js/restaurant_info.js',
		'./js/idb.js',
		'https://unpkg.com/leaflet@1.3.1/dist/leaflet.css',
		'https://unpkg.com/leaflet@1.3.1/dist/leaflet.js',
		 ];
/**
 * This block is invoked when install event is fired
 */
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(staticCacheName).then(function(cache) {
      return cache.addAll(filesToCache);
    })
  );
});
// deletes old cache
self.addEventListener('activate', function(event) {
  // console.log("Service Worker activated");
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          return cacheName.startsWith('restaurant-reviews-') &&
                 cacheName != staticCacheName;
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
       console.log("Old cache removed");
    })
  );
});

self.addEventListener('fetch', function(event) {
	var requestUrl = new URL(event.request.url);
	// Check if the image type
  if (/\.(jpg|png|gif|webp).*$/.test(requestUrl.pathname)) {
	  event.respondWith(cacheImages(event.request));
   return;
}
event.respondWith(
  /*  fetch(returnUrl, {
		     mode: 'no-cors'
		   }) */
    caches.open(staticCacheName).then(function(cache) {
      return cache.match(event.request).then(function (response) {
        if (response) {
          // console.log("data fetched from cache");
          return response;
        }
        else {
          return fetch(event.request).then(function(networkResponse) {
            // console.log("data fetched from network", event.request.url);
            //cache.put(event.request, networkResponse.clone());
            return networkResponse;
          }).catch(function(error) {
            console.log("Unable to fetch data from network", event.request.url, error);
          });
        }
      });
    }).catch(function(error) {
     // console.log("Something went wrong with Service Worker fetch intercept", error);
	 return caches.match('offline.html', error);
	  
    })
  );
});

/**
* @description Adds photos to the imgCache
* @param {string} request
* @returns {Response}
*/
function cacheImages(request) {
  var storageUrl = new URL(request.url).pathname;

  return caches.open(imgCache).then(function(cache) {
    return cache.match(storageUrl).then(function(response) {
      if (response) return response;

      return fetch(request).then(function(networkResponse) {
        cache.put(storageUrl, networkResponse.clone());
        return networkResponse;
      });
    });
  });
}

/* // Inspect the accept header for WebP support
  var supportsWebp = false;
  if (event.request.headers.has('accept')){
	supportsWebp = event.request.headers
        	                    .get('accept')
                                    .includes('webp');
      	}
		// If we support WebP
  	if (supportsWebp)
  	{
		// Clone the request
		var req = event.request.clone();

	        // Build the return URL
	    	var returnUrl = req.url.substr(0, req.url.lastIndexOf(".")) + ".webp";
	//console.log("Service Worker starting fetch"); */
  

 