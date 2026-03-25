#!/usr/bin/env node

import axios from "axios";

const domain = "martinchrbuur.atlassian.net";
const token =
  "ATATT3xFfGF04mzfkV0-lWsnihZ-Swh9Y6rmD_72QZruL_ebWrCBjEnBTa6bC7V0PomlLYWo1t3c-ObTUuwQWmGhdS6Cwn9nTMo53oF65Df0QN4idb66pItVlQc4Cuzghp8z6AsgYuBY6tstDKz-MyEA5ly8H0m3DN4GrdPTp516rNz295zihqY=049C4A57";
const email = "martin.chr.buur@gmail.com";
const boardId = 3;

const client = axios.create({
  baseURL: `https://${domain}`,
  auth: {
    username: email,
    password: token,
  },
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

function key(n) {
  return `KAN-${n}`;
}

const sprintPlan = [
  {
    name: "AI V1 Sprint 1 - Foundation",
    goal: "Deliver secure foundation: auth, child profiles, chore model, completion flow, and access control.",
    issues: [
      6, 7, 8, 9, 14, 15, 16, 18, 21, 22, 25, 26, 41, 44, 46, 48, 50, 56,
    ].map(key),
  },
  {
    name: "AI V1 Sprint 2 - Money Loop",
    goal: "Deliver core earning loop: approvals to allowance ledger, balances, dashboard baseline, and household isolation.",
    issues: [10, 12, 19, 23, 27, 28, 29, 30, 35, 36, 42, 52, 54, 60].map(key),
  },
  {
    name: "AI V1 Sprint 3 - Engagement",
    goal: "Add financial education, notification capabilities, and reporting enhancements for adoption.",
    issues: [11, 13, 20, 32, 33, 38, 39, 40, 53, 55, 57, 58].map(key),
  },
  {
    name: "AI V1 Sprint 4 - Hardening",
    goal: "Finalize with password reset, templates, redemption, trend polish, data lifecycle controls, and QA hardening.",
    issues: [17, 24, 31, 34, 37, 43, 45, 47, 49, 51, 59, 61].map(key),
  },
];

function addDays(date, days) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function toIsoAt(date, hour) {
  const dt = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), hour, 0, 0));
  return dt.toISOString();
}

async function ensureNoMissingIssues() {
  const expected = new Set(Array.from({ length: 56 }, (_, i) => key(6 + i)));
  const assigned = new Set(sprintPlan.flatMap((s) => s.issues));

  const missing = Array.from(expected).filter((k) => !assigned.has(k));
  const duplicateMap = {};
  for (const k of sprintPlan.flatMap((s) => s.issues)) {
    duplicateMap[k] = (duplicateMap[k] || 0) + 1;
  }
  const duplicates = Object.entries(duplicateMap)
    .filter(([, count]) => count > 1)
    .map(([k]) => k);

  if (missing.length || duplicates.length) {
    throw new Error(
      `Plan validation failed. Missing: ${missing.join(", ") || "none"}. Duplicates: ${duplicates.join(", ") || "none"}.`
    );
  }
}

async function createSprint(name, goal, startDate, endDate) {
  const response = await client.post("/rest/agile/1.0/sprint", {
    name,
    originBoardId: boardId,
    startDate,
    endDate,
    goal,
  });
  return response.data;
}

async function assignIssuesToSprint(sprintId, issues) {
  await client.post(`/rest/agile/1.0/sprint/${sprintId}/issue`, {
    issues,
  });
}

async function main() {
  await ensureNoMissingIssues();

  const anchor = new Date(Date.UTC(2026, 2, 30));
  const created = [];

  for (let i = 0; i < sprintPlan.length; i++) {
    const sprint = sprintPlan[i];
    const start = addDays(anchor, i * 7);
    const end = addDays(anchor, i * 7 + 6);

    const createdSprint = await createSprint(
      sprint.name,
      sprint.goal,
      toIsoAt(start, 9),
      toIsoAt(end, 17)
    );

    await assignIssuesToSprint(createdSprint.id, sprint.issues);
    created.push({
      id: createdSprint.id,
      name: createdSprint.name,
      issueCount: sprint.issues.length,
      startDate: createdSprint.startDate,
      endDate: createdSprint.endDate,
    });
  }

  console.log("=== SPRINT PRIORITIZATION SUMMARY ===");
  for (const sprint of created) {
    console.log(
      `${sprint.name} (ID ${sprint.id}) | issues=${sprint.issueCount} | ${sprint.startDate} -> ${sprint.endDate}`
    );
  }
  console.log(`Total assigned issues: ${created.reduce((sum, s) => sum + s.issueCount, 0)}`);
  console.log(`Board: https://${domain}/jira/software/projects/KAN/boards/3/backlog`);
}

main().catch((error) => {
  console.error("Failed to prioritize into sprints:");
  if (error.response?.data) {
    console.error(JSON.stringify(error.response.data, null, 2));
  } else {
    console.error(error.message);
  }
  process.exit(1);
});
