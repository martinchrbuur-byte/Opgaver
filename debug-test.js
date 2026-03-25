#!/usr/bin/env node

import { spawn } from "child_process";

const serverProcess = spawn("node", ["build/index.js"], {
  env: {
    ...process.env,
    ATLASSIAN_DOMAIN: "martinchrbuur.atlassian.net",
    ATLASSIAN_API_TOKEN:
      "ATATT3xFfGF04mzfkV0-lWsnihZ-Swh9Y6rmD_72QZruL_ebWrCBjEnBTa6bC7V0PomlLYWo1t3c-ObTUuwQWmGhdS6Cwn9nTMo53oF65Df0QN4idb66pItVlQc4Cuzghp8z6AsgYuBY6tstDKz-MyEA5ly8H0m3DN4GrdPTp516rNz295zihqY=049C4A57",
    ATLASSIAN_USER_EMAIL: "martin.chr.buur@gmail.com",
  },
});

let dataBuffer = "";
let isFirstResponse = true;

serverProcess.stdout.on("data", (data) => {
  dataBuffer += data.toString();
  console.log("Raw output:", data.toString().substring(0, 200));
});

serverProcess.stderr.on("data", (data) => {
  const msg = data.toString();
  if (!msg.includes("running on stdio")) {
    console.error("STDERR:", msg);
  }
});

// Send request
setTimeout(() => {
  const request = {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: "list_projects",
      arguments: { maxResults: 5 },
    },
  };

  console.log("📤 Sending:", JSON.stringify(request));
  serverProcess.stdin.write(JSON.stringify(request) + "\n");
}, 500);

setTimeout(() => {
  console.log("\n📦 Complete buffer:", dataBuffer.substring(0, 300));
  serverProcess.kill();
}, 3000);
