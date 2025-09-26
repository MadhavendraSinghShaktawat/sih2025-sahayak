// Service Worker for Offline Ollama Request Handling
const CACHE_NAME = 'sahayak-offline-v1';
const OLLAMA_CACHE_NAME = 'ollama-responses-v1';

// Install event - set up caches
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Cache opened');
      return cache.addAll([
        // Add any static assets you want to cache
        '/',
        '/offline.html' // We'll create this as a fallback
      ]);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== OLLAMA_CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle Ollama requests
  if (url.hostname === 'localhost' && url.port === '11434') {
    console.log('Service Worker: Intercepting Ollama request:', url.pathname);
    
    event.respondWith(handleOllamaRequest(request));
  }
});

// Handle Ollama API requests
async function handleOllamaRequest(request) {
  try {
    // Try to make the actual request first
    console.log('Service Worker: Attempting Ollama request...');
    const response = await fetch(request);
    
    if (response.ok) {
      console.log('Service Worker: Ollama request successful');
      
      // Cache successful responses for future offline use
      if (request.method === 'POST' && request.url.includes('/api/generate')) {
        const responseClone = response.clone();
        const cache = await caches.open(OLLAMA_CACHE_NAME);
        
        // Create a cache key based on request content
        const requestBody = await request.clone().text();
        const cacheKey = `ollama-generate-${hashString(requestBody)}`;
        
        await cache.put(cacheKey, responseClone);
        console.log('Service Worker: Cached Ollama response');
      }
      
      return response;
    } else {
      throw new Error(`Ollama request failed: ${response.status}`);
    }
  } catch (error) {
    console.log('Service Worker: Ollama request failed, trying cache:', error.message);
    
    // If request fails, try to serve from cache
    if (request.method === 'POST' && request.url.includes('/api/generate')) {
      const requestBody = await request.clone().text();
      const cacheKey = `ollama-generate-${hashString(requestBody)}`;
      
      const cache = await caches.open(OLLAMA_CACHE_NAME);
      const cachedResponse = await cache.match(cacheKey);
      
      if (cachedResponse) {
        console.log('Service Worker: Serving cached Ollama response');
        return cachedResponse;
      }
    }
    
    // If no cache available, return a fallback response
    console.log('Service Worker: No cache available, returning fallback');
    return createFallbackResponse(request);
  }
}

// Create a fallback response when Ollama is not available
function createFallbackResponse(request) {
  const url = new URL(request.url);
  
  if (url.pathname === '/api/tags') {
    // Return a mock tags response
    return new Response(JSON.stringify({
      models: [
        {
          name: "tinyllama:latest",
          model: "tinyllama:latest",
          modified_at: new Date().toISOString(),
          size: 637700138,
          digest: "2644915ede352ea7bdfaff0bfac0be74c719d5d5202acb63a6fb095b52"
        }
      ]
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
  
  if (url.pathname === '/api/generate') {
    // Return a mock quiz generation response
    return new Response(JSON.stringify({
      model: "tinyllama:latest",
      created_at: new Date().toISOString(),
      response: JSON.stringify({
        title: "Offline Quiz",
        description: "A quiz generated offline using cached responses",
        questions: [
          {
            id: "q1",
            type: "mcq",
            question: "This is an offline quiz question. What is the correct answer?",
            options: ["Option A", "Option B", "Option C", "Option D"],
            correctAnswer: 0,
            explanations: {
              correct: "This is the correct answer for the offline quiz.",
              incorrect: [
                "This option is incorrect.",
                "This option is also incorrect.",
                "This option is not correct."
              ]
            },
            feedback: {
              correct: "✅ Correct!",
              incorrect: "❌ Incorrect. Please try again."
            },
            points: 1
          }
        ],
        metadata: {
          subject: "General",
          class: "Any",
          language: "English",
          difficulty: "medium",
          estimatedTime: 5,
          createdAt: new Date().toISOString(),
          generatedBy: "offline-cache"
        }
      }),
      done: true
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
  
  // Default fallback
  return new Response(JSON.stringify({
    error: "Service unavailable offline",
    message: "This request cannot be fulfilled offline"
  }), {
    status: 503,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

// Simple hash function for creating cache keys
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

// Handle service worker messages
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('Service Worker: Loaded successfully');
