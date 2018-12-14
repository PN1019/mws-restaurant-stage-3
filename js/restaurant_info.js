let restaurant;
var newMap;

/**
 * Initialize map & indexed db as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
    DBHelper.initIDB(); //Initialize indexed db
    initMap();
    window.addEventListener('online', syncReviews);
});

/**
 * Initialize leaflet map
 */
initMap = () => {
    fetchRestaurantFromURL((error, restaurant) => {
        if (error) { // Got an error!
            console.error(error);
        } else {
            self.newMap = L.map('map', {
                center: [restaurant.latlng.lat, restaurant.latlng.lng],
                zoom: 16,
                scrollWheelZoom: false
            });
            L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
                mapboxToken: 'pk.eyJ1IjoicG4xMCIsImEiOiJjam15azJmMHUwbWNkM3FscmtnaGM3d2p6In0.peE7tNl1RD66esWr2Eokxw',
                maxZoom: 18,
                attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
                    '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
                    'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
                id: 'mapbox.streets'
            }).addTo(newMap);
            fillBreadcrumb();
            DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
        }
    });
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
    if (self.restaurant) { // restaurant already fetched!
        callback(null, self.restaurant)
        return;
    }
    const id = getParameterByName('id');
    if (!id) { // no id found in URL
        error = 'No restaurant id in URL';
        callback(error, null);
    } else {
        DBHelper.fetchRestaurantById(id, (error, restaurant) => {
            self.restaurant = restaurant;
            if (!restaurant) {
                console.error(error);
                return;
            }
            fillRestaurantHTML();
            callback(null, restaurant)
        });
    }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
    const name = document.getElementById('restaurant-name');
    name.innerHTML = restaurant.name;
    name.tabIndex = 0;

    const address = document.getElementById('restaurant-address');
    address.innerHTML = restaurant.address;
    address.tabIndex = 0;
    //favorite button
    const favorite = document.getElementById('restaurant-fav');
    if (restaurant.is_favorite === 'true') {
        favorite.classList.add('active');
        favorite.setAttribute('aria-pressed', 'true');
        favorite.innerHTML = `Remove ${restaurant.name} as a favorite`;
        favorite.title = `Remove ${restaurant.name} as a favorite`;
    } else {
        favorite.setAttribute('aria-pressed', 'false');
        favorite.innerHTML = `Add ${restaurant.name} as a favorite`;
        favorite.title = `Add ${restaurant.name} as a favorite`;
    }
    favorite.addEventListener('click', (evt) => {
        evt.preventDefault();
        if (favorite.classList.contains('active')) {
            favorite.setAttribute('aria-pressed', 'false');
            favorite.innerHTML = `Add ${restaurant.name} as a favorite`;
            favorite.title = `Add ${restaurant.name} as a favorite`;
            DBHelper.unMarkFavorite(restaurant.id);
        } else {
            favorite.setAttribute('aria-pressed', 'true');
            favorite.innerHTML = `Remove ${restaurant.name} as a favorite`;
            favorite.title = `Remove ${restaurant.name} as a favorite`;
            DBHelper.markFavorite(restaurant.id);
        }
        favorite.classList.toggle('active');
    });

    const image = document.getElementById('restaurant-img');
    image.className = 'restaurant-img'
    image.src = DBHelper.imageUrlForRestaurant(restaurant);
    // Add alt-text for image according to restaurant name.
    image.alt = "Image of the restaurant " + restaurant.name;
    image.tabIndex = 0;
    const cuisine = document.getElementById('restaurant-cuisine');
    cuisine.innerHTML = restaurant.cuisine_type;
    cuisine.tabIndex = 0;
    // fill operating hours
    if (restaurant.operating_hours) {
        fillRestaurantHoursHTML();
    }
    // fill reviews
    //fillReviewsHTML();
    fetchRestaurantReviews();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
    const hours = document.getElementById('restaurant-hours');
    for (let key in operatingHours) {
        const row = document.createElement('tr');

        const day = document.createElement('td');
        day.innerHTML = key;
        day.tabIndex = 0;
        row.appendChild(day);

        const time = document.createElement('td');
        time.innerHTML = operatingHours[key];
        time.tabIndex = 0;
        row.appendChild(time);


        const opHours = document.createElement('span');
        opHours.innerHTML = operatingHours[key];
        time.append(opHours);

        hours.appendChild(row);
        row.appendChild(time);
    }
}

/**
 * Fetch Restaurant reviews
 */
fetchRestaurantReviews = () => {
    const restaurantID = getParameterByName("id");
    if (!restaurantID) {
        console.error('No restaurant id in URL');
        return;
    }
    DBHelper.fetchReviewsById(restaurantID, (err, reviews) => {
        if (err || !reviews) {
            console.log(`No reviews for restaurant id ${restaurantID}`);
            return;
        }
        fillReviewsHTML(reviews);
    });
};


/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
    const container = document.getElementById('reviews-container');
    const title = document.createElement('h3');
    title.innerHTML = 'Reviews';
    title.tabIndex = 0;
    container.appendChild(title);

    if (!reviews) {
        const noReviews = document.createElement('p');
        noReviews.innerHTML = 'No reviews yet!';
        noReviews.tabIndex = 0;
        container.appendChild(noReviews);
        return;
    }
    const ul = document.getElementById('reviews-list');
    reviews.forEach(review => {
        ul.appendChild(createReviewHTML(review));
    });
    container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
    const li = document.createElement('li');
    const name = document.createElement('p');
    name.innerHTML = review.name;
    name.tabIndex = 0;
    li.appendChild(name);

    const date = document.createElement('p');
    date.innerHTML = review.date;
    date.tabIndex = 0;
    li.appendChild(date);


    const createdAt = document.createElement('span');
    createdAt.innerHTML = new Date(review.createdAt).toDateString();
    date.append(createdAt);
    header.appendChild(date);
    li.appendChild(header);

    const rating = document.createElement('p');
    rating.innerHTML = `Rating: ${review.rating}`;
    rating.tabIndex = 0;
    li.appendChild(rating);

    const comments = document.createElement('p');
    comments.innerHTML = review.comments;
    comments.tabIndex = 0;
    li.appendChild(comments);

    return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
    const breadcrumb = document.getElementById('breadcrumb');
    const li = document.createElement('li');
    li.innerHTML = restaurant.name;
    breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
    if (!url)
        url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
        results = regex.exec(url);
    if (!results)
        return null;
    if (!results[2])
        return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
};

const reviewForm = document.querySelector('.review-form');
/**
 * Submit review which is entered by user.
 */
reviewForm.addEventListener('submit', event => {
            event.preventDefault();
            const reviewObject = {
                restaurant_id: self.restaurant.id,
                name: reviewForm.querySelector('#name').value,
                rating: self.restaurant.rating == undefined ? 1 : self.restaurant.rating,
                comments: reviewForm.querySelector('#comment').value,
            }
            const reviewList = document.querySelector('#reviews-list');
            if (navigator.onLine) {
                DBHelper.submitReview(reviewObject).then(data => {
                    reviewList.appendChild(createReviewHTML(reviewObject));
                    reviewForm.reset();
                    setRating(1);
                });
                const ratingStarArray = document.querySelectorAll('.rating-star');
                const CLASS_STAR_EMPTY = 'star-empty';
                const CLASS_STAR_FILLED = 'star-filled';
                const CLASS_SELECTED = 'selected';
                ratingStarArray.forEach(ratingStar => {
                    ratingStar.addEventListener('mouseover', event => {
                        var rating = parseInt(event.target.dataset.rating);
                        // fill all the stars
                        addAndRemoveClass(ratingStarArray, CLASS_STAR_FILLED, CLASS_STAR_EMPTY);
                        // de-select all the stars to the right of the mouse
                        deSelectStarsToRight(rating, CLASS_STAR_EMPTY, CLASS_STAR_FILLED);
                    });
                    ratingStar.addEventListener('mouseleave', event => {
                        addAndRemoveClass(ratingStarArray, CLASS_STAR_EMPTY, CLASS_STAR_FILLED);
                    });
                    ratingStar.addEventListener('click', event => {
                        setRating(parseInt(event.target.dataset.rating));
                    });
                    ratingStar.addEventListener('keydown', event => {
                        // if Spacebar or Enter button is pressed while selecting a star
                        if (event.code === "Space" || event.code === "Enter") {
                            setRating(parseInt(event.target.dataset.rating));
                        }
                    });
                });
                /**
                 * @description
                 * This function will fill all the stars.
                 * @param {Array} elemArray
                 * @param {string} addClass
                 * @param {string} removeClass
                 */
                function addAndRemoveClass(elemArray, addClass, removeClass) {
                    elemArray.forEach(element => {
                        element.classList.add(addClass);
                        element.classList.remove(removeClass);
                    });
                }
                /**
                 * @description
                 * This function will de-select all the stars to the right of the mouse
                 * @param {string} rating
                 * @param {string} addClass
                 * @param {string} removeClass
                 */
                function deSelectStarsToRight(rating, addClass, removeClass) {
                    let elemArray = document.querySelectorAll('#rating' + rating + '~.rating-star');
                    addAndRemoveClass(elemArray, addClass, removeClass);
                }
                /**
                 * @description
                 * Sets the rating
                 * @param {number} rating
                 */
                function setRating(rating) {
                    self.restaurant.rating = rating;
                    // select the stars before the selected star by assigning the '.selected' class.
                    addAndRemoveClass(ratingStarArray, CLASS_SELECTED, CLASS_STAR_EMPTY);
                    // deselect all the stars to the right of the selected star.
                    deSelectStarsToRight(rating, CLASS_STAR_EMPTY, CLASS_SELECTED);
                }

                /**
                 * @description
                 * Post reviews which are stored in the  restaurantReviewsOffline to the server.
                 */
                function syncReviews() {
                    //Get all reviews saved in restaurantReviewsOffline
                    DBHelper.getOfflineReviewsFromIDBCache().then(reviews => {
                        //Submit offline reviews to server delete the review from restaurantReviewsOffline.
                        reviews.forEach(review => {
                            DBHelper.submitReview(review, true).then(data => {
                                console.log(`Review from ${data.name} posted successfully to the server.`);
                            }).catch(error => {
                                console.log('Couldn\'t connect to network', error);
                            })
                        });
                    }).catch(error => console.log(error));
                }