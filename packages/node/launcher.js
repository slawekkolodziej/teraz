'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const http_1 = require('http')
const bridge_1 = require('./bridge')
let listener
let setup
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production'
}
// PLACEHOLDER
const server = new http_1.Server(listener)
const bridge = new bridge_1.Bridge(server)
bridge.listen()
exports.launcher = bridge.launcher
