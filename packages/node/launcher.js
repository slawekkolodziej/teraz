'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const http = require('http')
const bridge = require('./bridge')
let listener
let setup
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production'
}
// PLACEHOLDER
const server = new http.Server(listener)
const bridge = new bridge.Bridge(server)
bridge.listen()
exports.launcher = bridge.launcher
