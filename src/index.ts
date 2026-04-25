#!/usr/bin/env node
import { runServer } from './server.js';

runServer().catch((error) => {
  console.error('Fatal error starting Licinexus MCP server:', error);
  process.exit(1);
});
