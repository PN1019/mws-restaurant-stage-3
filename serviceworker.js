/* import ('./js/idb'); */
 if (typeof idb === "undefined") {
        self.importScripts('js/idb.js');
    }
/* if (typeof idb=== "undefined"){
    console.log('failed to import idb');
}else{
    console.log('imported idb');
} */

 
const staticCacheName = 'restaurant-statics-v4';
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
          return cacheName.startsWith('restaurant-statics-') &&
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
* @description Adds images to the imgCache
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
 
 self.addEventListener('sync', function(event) {
  if (event.tag == 'restaurantReviewsOffline') {
    event.waitUntil(syncReviews());
  }
});
 function syncReviews(){
   return idb.open('restaurant-reviews', 1).then(db => {
     const tx = db.transaction('restaurantReviewsOffline', 'readwrite');
    const store = tx.objectStore('restaurantReviewsOffline');
    //Get all reviews saved in restaurantReviewsOffline
    store.getAll().then(reviews => {
      //Submit offline reviews to server
      reviews.forEach(review => {
        fetch('http://localhost:1337/reviews/', {
          body: JSON.stringify(review),
          headers: {
            'Content-Type': 'application/json'
          },
          method: "POST"
         }).then(response => {
          //Save submitted review to IDB and delete the review from restaurantReviewsOffline.
          return response.json().then(data => {
            let tx = db.transaction('restaurantReviews', 'readwrite');
            let store = tx.objectStore('restaurantReviews');
            store.put(data).then(function(id){
              let tx = db.transaction('restaurantReviewsOffline', 'readwrite');
              let store = tx.objectStore('restaurantReviewsOffline');
              store.delete(data.updatedAt);
              return tx.complete;
            }).catch(function(error){
              console.log('Unable to save data to IDB', error);
            });
            return tx.complete;
          }).catch(error => {
            console.log('Couldn\'t connect to network' , error);
          })
        })
      });
    }).catch(function (error) {
      console.log(error);
    });
   }).catch(function (error) {
    console.log(error);
  });
} 

 