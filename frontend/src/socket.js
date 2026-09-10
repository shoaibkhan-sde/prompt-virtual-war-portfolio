import { io } from "socket.io-client";

// "undefined" means the URL will be computed from the `window.location` object
const URL = import.meta.env.PROD ? undefined : "http://localhost:5000";

/**
 * Socket.IO client instance.
 * Lazy-auth: Token is checked on every connection attempt rather than blocking load.
 */
export const socket = io(URL, {
  autoConnect: true,
  auth: (cb) => {
    // Dynamic token retrieval prevents top-level await from blocking the React UI
    const token = localStorage.getItem('venueflow_token');
    cb({ token });
  }
});
