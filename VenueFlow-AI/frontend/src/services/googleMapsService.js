/**
 * googleMapsService.js
 * Centralized loader for Google Maps Platform.
 */
import { Loader } from '@googlemaps/js-api-loader';

// Accessing environment variable from Vite
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

const loader = new Loader({
  apiKey: API_KEY,
  version: 'weekly',
  libraries: ['marker', 'places', 'geometry', 'visualization'],
});

let googlePromise = null;

export const loadGoogleMaps = () => {
  if (!googlePromise) {
    if (!API_KEY) {
      console.warn('Google Maps API Key is missing. Map features will be limited.');
    }
    googlePromise = loader.load();
  }
  return googlePromise;
};
