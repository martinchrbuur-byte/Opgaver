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

const mustKeys = new Set([
  "KAN-6",
  "KAN-7",
  "KAN-8",
  "KAN-9",
  "KAN-10",
  "KAN-12",
  "KAN-14",
  "KAN-15",
  "KAN-16",
  "KAN-18",
  "KAN-19",
  "KAN-21",
  "KAN-22",
  "KAN-23",
  "KAN-25",
  "KAN-26",
  "KAN-27",
  "KAN-28",
  "KAN-29",
  "KAN-30",
  "KAN-35",
  "KAN-36",
  "KAN-41",
  "KAN-42",
  "KAN-44",
  "KAN-46",
  "KAN-48",
  "KAN-50",
  "KAN-52",
  "KAN-56",
  "KAN-60",
]);

const shouldKeys = new Set([
  "KAN-11",
  "KAN-13",
  "KAN-17",
  "KAN-20",
  "KAN-32",
  "KAN-33",
  "KAN-34",
  "KAN-38",
  "KAN-39",
  "KAN-43",
  "KAN-45",
  "KAN-47",
  "KAN-49",
  "KAN-51",
  "KAN-53",
  "KAN-54",
  "KAN-55",
  "KAN-57",
  "KAN-58",
  "KAN-59",
  "KAN-61",
]);

const couldKeys = new Set(["KAN-24", "KAN-31", "KAN-37", "KAN-40"]);

const allKeys = Array.from({ length: 56 }, (_, i) => `KAN-${6 + i}`);

function classify(key) {
  if (mustKeys.has(key)) {
    return { moscow: "must", priority: "High" };
  }
  if (shouldKeys.has(key)) {
    return { moscow: "should", priority: "Medium" };
  }
  if (couldKeys.has(key)) {
    return { moscow: "could", priority: "Low" };
  }
  return { moscow: "should", priority: "Medium" };
}

async function getLabels(key) {
  const res = await client.get(`/issue/${key}`, { params: { fields: "labels" } });
  return res.data?.fields?.labels || [];
}

async function updateIssue(key, priority, labels) {
  await client.put(`/issue/${key}`, {
    fields: {
      priority: { name: priority },
      labels,
    },
  });
}

async function main() {
  let updated = 0;
  let mustCount = 0;
  let shouldCount = 0;
  let couldCount = 0;

  for (const key of allKeys) {
    const { moscow, priority } = classify(key);
    const existingLabels = await getLabels(key);

    const cleaned = existingLabels.filter(
      (label) => label !== "moscow-must" && label !== "moscow-should" && label !== "moscow-could"
    );
    const merged = Array.from(new Set([...cleaned, `moscow-${moscow}`]));

    await updateIssue(key, priority, merged);
    updated++;

    if (moscow === "must") mustCount++;
    else if (moscow === "should") shouldCount++;
    else couldCount++;
  }

  console.log("=== PRIORITY SUMMARY ===");
  console.log(`Updated issues: ${updated}`);
  console.log(`Must (High): ${mustCount}`);
  console.log(`Should (Medium): ${shouldCount}`);
  console.log(`Could (Low): ${couldCount}`);
  console.log(`Browse: https://${domain}/jira/software/projects/KAN/list`);
}

main().catch((error) => {
  console.error("Failed to set priorities:");
  if (error.response?.data) {
    console.error(JSON.stringify(error.response.data, null, 2));
  } else {
    console.error(error.message);
  }
  process.exit(1);
});
