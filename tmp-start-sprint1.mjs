import axios from "axios";

const domain = "martinchrbuur.atlassian.net";
const token = "ATATT3xFfGF04mzfkV0-lWsnihZ-Swh9Y6rmD_72QZruL_ebWrCBjEnBTa6bC7V0PomlLYWo1t3c-ObTUuwQWmGhdS6Cwn9nTMo53oF65Df0QN4idb66pItVlQc4Cuzghp8z6AsgYuBY6tstDKz-MyEA5ly8H0m3DN4GrdPTp516rNz295zihqY=049C4A57";
const email = "martin.chr.buur@gmail.com";

const client = axios.create({
  baseURL: `https://${domain}`,
  auth: { username: email, password: token },
  headers: { Accept: "application/json", "Content-Type": "application/json" },
});

const sprintId = 1;
const sprint1Issues = [
  "KAN-6","KAN-7","KAN-8","KAN-9","KAN-14","KAN-15","KAN-16","KAN-18","KAN-21",
  "KAN-22","KAN-25","KAN-26","KAN-41","KAN-44","KAN-46","KAN-48","KAN-50","KAN-56"
];

async function ensureSprintActive() {
  const now = new Date();
  const end = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000);
  try {
    await client.post(`/rest/agile/1.0/sprint/${sprintId}`, {
      state: "active",
      startDate: now.toISOString(),
      endDate: end.toISOString(),
    });
  } catch (e) {
    if (e.response?.status === 404 || e.response?.status === 405) {
      await client.put(`/rest/agile/1.0/sprint/${sprintId}`, {
        state: "active",
        startDate: now.toISOString(),
        endDate: end.toISOString(),
      });
    } else {
      throw e;
    }
  }
}

async function moveToInProgress(issueKey) {
  const t = await client.get(`/rest/api/3/issue/${issueKey}/transitions`);
  const transitions = t.data.transitions || [];
  const target = transitions.find((x) => {
    const n = (x.name || "").toLowerCase();
    return n === "in progress" || n === "start progress" || n.includes("in progress");
  });

  if (!target) {
    return { issueKey, moved: false, reason: "No In Progress transition available" };
  }

  await client.post(`/rest/api/3/issue/${issueKey}/transitions`, {
    transition: { id: target.id },
  });

  return { issueKey, moved: true };
}

async function main() {
  await ensureSprintActive();

  const moved = [];
  const skipped = [];

  for (const key of sprint1Issues) {
    try {
      const res = await moveToInProgress(key);
      if (res.moved) moved.push(key);
      else skipped.push(`${key}: ${res.reason}`);
    } catch (e) {
      skipped.push(`${key}: ${e.response?.data?.errorMessages?.join(" | ") || e.message}`);
    }
  }

  console.log("=== SPRINT 1 START SUMMARY ===");
  console.log(`Sprint ${sprintId} set to active.`);
  console.log(`Moved to In Progress: ${moved.length}`);
  if (moved.length) console.log(moved.join(", "));
  console.log(`Skipped: ${skipped.length}`);
  if (skipped.length) console.log(skipped.join("\n"));
  console.log(`Board: https://${domain}/jira/software/projects/KAN/boards/3/backlog`);
}

main().catch((e) => {
  console.error("Failed to start sprint or transition issues:");
  if (e.response?.data) console.error(JSON.stringify(e.response.data, null, 2));
  else console.error(e.message);
  process.exit(1);
});
