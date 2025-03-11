// Add ReadableStream polyfill for Node.js
const { ReadableStream } = require('web-streams-polyfill');

// Expose ReadableStream globally
global.ReadableStream = ReadableStream;

// Redirect to the actual index file
require('./src/index.js');