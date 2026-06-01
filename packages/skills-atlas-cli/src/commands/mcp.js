// `skills-atlas mcp` — start the stdio MCP server (blocks; speaks JSON-RPC 2.0 over
// stdin/stdout for an MCP client to spawn). All logic lives in ../mcp.
'use strict';

module.exports = () => require('../mcp').start();
