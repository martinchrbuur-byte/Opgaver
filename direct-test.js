#!/usr/bin/env node

import axios from "axios";

const domain = "martinchrbuur.atlassian.net";
const token = "ATATT3xFfGF04mzfkV0-lWsnihZ-Swh9Y6rmD_72QZruL_ebWrCBjEnBTa6bC7V0PomlLYWo1t3c-ObTUuwQWmGhdS6Cwn9nTMo53oF65Df0QN4idb66pItVlQc4Cuzghp8z6AsgYuBY6tstDKz-MyEA5ly8H0m3DN4GrdPTp516rNz295zihqY=049C4A57";
const email = "martin.chr.buur@gmail.com";

const client = axios.create({
  baseURL: `https://${domain}/rest/api/3`,
  auth: {
    username: email,
    password: token,
  },
  headers: {
    "Content-Type": "application/json",
  },
});

async function test() {
  try {
    // Get project details to see available issue types
    console.log("🔍 Getting project details...");
    const projectRes = await client.get("/project/SAM1");
    console.log("✅ Project found:", projectRes.data.name);
    
    console.log("\n🔍 Looking for issue types...");
    if (projectRes.data.issueTypes) {
      projectRes.data.issueTypes.forEach((type) => {
        console.log(`  - ${type.name} (ID: ${type.id})`);
      });
    }

    // Try to create an issue with Task type using ID
    console.log("\n📝 Attempting to create issue...");
    const payload = {
      fields: {
        project: { key: "SAM1" },
        summary: "Test Story Created via API",
        issuetype: { id: "10006" }, // Story type ID
        description: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "This is a test story created via MCP server integration",
                },
              ],
            },
          ],
        },
      },
    };

    console.log("Payload:", JSON.stringify(payload, null, 2));
    const createRes = await client.post("/issue", payload);
    console.log("✅ Issue created successfully!");
    console.log(`📌 Key: ${createRes.data.key}`);
    console.log(`🔗 URL: https://${domain}/browse/${createRes.data.key}`);
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
}

test();
