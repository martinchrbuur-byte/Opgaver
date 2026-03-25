#!/usr/bin/env node

import axios from "axios";

const domain = "martinchrbuur.atlassian.net";
const token =
  "ATATT3xFfGF04mzfkV0-lWsnihZ-Swh9Y6rmD_72QZruL_ebWrCBjEnBTa6bC7V0PomlLYWo1t3c-ObTUuwQWmGhdS6Cwn9nTMo53oF65Df0QN4idb66pItVlQc4Cuzghp8z6AsgYuBY6tstDKz-MyEA5ly8H0m3DN4GrdPTp516rNz295zihqY=049C4A57";
const email = "martin.chr.buur@gmail.com";

const client = axios.create({
  baseURL: `https://${domain}/rest/api/3`,
  auth: {
    username: email,
    password: token,
  },
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

const epicKeys = [
  "KAN-6",
  "KAN-7",
  "KAN-8",
  "KAN-9",
  "KAN-10",
  "KAN-11",
  "KAN-12",
  "KAN-13",
  "KAN-14",
];

const storiesByEpic = {
  "KAN-6": ["KAN-15", "KAN-16", "KAN-17"],
  "KAN-7": ["KAN-18", "KAN-19", "KAN-20"],
  "KAN-8": ["KAN-21", "KAN-22", "KAN-23", "KAN-24"],
  "KAN-9": ["KAN-25", "KAN-26", "KAN-27"],
  "KAN-10": ["KAN-28", "KAN-29", "KAN-30", "KAN-31"],
  "KAN-11": ["KAN-32", "KAN-33", "KAN-34"],
  "KAN-12": ["KAN-35", "KAN-36", "KAN-37"],
  "KAN-13": ["KAN-38", "KAN-39", "KAN-40"],
  "KAN-14": ["KAN-41", "KAN-42", "KAN-43"],
};

const taskKeys = Array.from({ length: 18 }, (_, i) => `KAN-${44 + i}`);

function roleLabelFromSummary(summary) {
  const text = (summary || "").toLowerCase();
  if (text.includes("as a parent")) return "role-parent";
  if (text.includes("as a child")) return "role-child";
  if (text.includes("as a system")) return "role-system";
  return "role-mixed";
}

async function getIssue(issueKey) {
  const res = await client.get(`/issue/${issueKey}`, {
    params: { fields: "summary,labels" },
  });
  return res.data;
}

async function updateIssue(issueKey, fields, update) {
  const payload = {};
  if (fields && Object.keys(fields).length > 0) payload.fields = fields;
  if (update && Object.keys(update).length > 0) payload.update = update;
  await client.put(`/issue/${issueKey}`, payload);
}

async function safeSetLabels(issueKey, labels) {
  await updateIssue(issueKey, { labels }, null);
}

async function main() {
  let linkSuccess = 0;
  let linkFailed = 0;
  let labelUpdated = 0;

  for (const epicKey of epicKeys) {
    const issue = await getIssue(epicKey);
    const existing = issue.fields.labels || [];
    const merged = Array.from(new Set([...existing, "v1", "busykid-inspired", "epic"]));
    await safeSetLabels(epicKey, merged);
    labelUpdated++;
  }

  for (const [epicKey, stories] of Object.entries(storiesByEpic)) {
    for (const storyKey of stories) {
      const issue = await getIssue(storyKey);
      const role = roleLabelFromSummary(issue.fields.summary);
      const existing = issue.fields.labels || [];
      const merged = Array.from(
        new Set([...existing, "v1", "busykid-inspired", "story", role])
      );

      try {
        await updateIssue(storyKey, { parent: { key: epicKey }, labels: merged }, null);
        linkSuccess++;
      } catch {
        try {
          await updateIssue(storyKey, { labels: merged }, null);
          await updateIssue(storyKey, null, {
            parent: [{ set: { key: epicKey } }],
          });
          linkSuccess++;
        } catch {
          linkFailed++;
        }
      }

      labelUpdated++;
    }
  }

  for (const taskKey of taskKeys) {
    const issue = await getIssue(taskKey);
    const existing = issue.fields.labels || [];
    const merged = Array.from(new Set([...existing, "v1", "busykid-inspired", "task"]));
    await safeSetLabels(taskKey, merged);
    labelUpdated++;
  }

  console.log("=== LINK/LABEL SUMMARY ===");
  console.log(`Stories linked to epics: ${linkSuccess}`);
  console.log(`Stories failed to link: ${linkFailed}`);
  console.log(`Issues label-updated: ${labelUpdated}`);
  console.log(`Browse: https://${domain}/jira/software/projects/KAN/list`);
}

main().catch((error) => {
  console.error("Failed to link/label issues:");
  if (error.response?.data) {
    console.error(JSON.stringify(error.response.data, null, 2));
  } else {
    console.error(error.message);
  }
  process.exit(1);
});
