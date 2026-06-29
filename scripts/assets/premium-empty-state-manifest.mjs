/** Curated lifestyle photography for premium empty states */

/** @type {Record<string, { urls: string[] }>} */
export const EMPTY_STATE_PHOTO_SOURCES = {
  "featured-listings": {
    urls: ["https://images.pexels.com/photos/5632402/pexels-photo-5632402.jpeg?auto=compress&cs=tinysrgb&w=1920"],
  },
  "popular-auctions": {
    urls: ["https://images.pexels.com/photos/9899618/pexels-photo-9899618.jpeg?auto=compress&cs=tinysrgb&w=1920"],
  },
  recommended: {
    urls: ["https://images.pexels.com/photos/3225171/pexels-photo-3225171.jpeg?auto=compress&cs=tinysrgb&w=1920"],
  },
  "recently-listed": {
    urls: ["https://images.pexels.com/photos/4483617/pexels-photo-4483617.jpeg?auto=compress&cs=tinysrgb&w=1920"],
  },
  "business-spotlight": {
    urls: ["https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=1920"],
  },
  "continue-browsing": {
    urls: ["https://images.pexels.com/photos/4391470/pexels-photo-4391470.jpeg?auto=compress&cs=tinysrgb&w=1920"],
  },
  messages: {
    urls: ["https://images.pexels.com/photos/7681097/pexels-photo-7681097.jpeg?auto=compress&cs=tinysrgb&w=1920"],
  },
  notifications: {
    urls: ["https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=1920"],
  },
  wishlist: {
    urls: ["https://images.pexels.com/photos/985167/pexels-photo-985167.jpeg?auto=compress&cs=tinysrgb&w=1920"],
  },
  orders: {
    urls: ["https://images.pexels.com/photos/4480501/pexels-photo-4480501.jpeg?auto=compress&cs=tinysrgb&w=1920"],
  },
  wallet: {
    urls: ["https://images.pexels.com/photos/4386431/pexels-photo-4386431.jpeg?auto=compress&cs=tinysrgb&w=1920"],
  },
  reviews: {
    urls: ["https://images.pexels.com/photos/3760067/pexels-photo-3760067.jpeg?auto=compress&cs=tinysrgb&w=1920"],
  },
};

export const EMPTY_STATE_IDS = Object.keys(EMPTY_STATE_PHOTO_SOURCES);
