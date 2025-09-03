require('@testing-library/jest-dom');
const { TextEncoder, TextDecoder } = require('util');
const fetch = require('node-fetch');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.Request = fetch.Request;
global.Response = fetch.Response;
global.Headers = fetch.Headers;
global.fetch = fetch;