import axios from "axios";
const client = axios.create({
  baseURL: "https://martinchrbuur.atlassian.net",
  auth: { username: "martin.chr.buur@gmail.com", password: "ATATT3xFfGF04mzfkV0-lWsnihZ-Swh9Y6rmD_72QZruL_ebWrCBjEnBTa6bC7V0PomlLYWo1t3c-ObTUuwQWmGhdS6Cwn9nTMo53oF65Df0QN4idb66pItVlQc4Cuzghp8z6AsgYuBY6tstDKz-MyEA5ly8H0m3DN4GrdPTp516rNz295zihqY=049C4A57" },
  headers: { Accept: "application/json", "Content-Type": "application/json" }
});

const run = async () => {
  const filterName = "KAN Scrum Sprint Filter";
  const f = await client.post("/rest/api/3/filter", {
    name: filterName,
    jql: "project = KAN ORDER BY priority DESC, created ASC",
    description: "Filter for AI sprint planning",
    favourite: true
  });
  console.log("Filter created", f.data.id);

  const b = await client.post("/rest/agile/1.0/board", {
    name: "KAN Scrum Board",
    type: "scrum",
    filterId: f.data.id,
    location: { type: "project", projectKeyOrId: "KAN" }
  });
  console.log("Board created", b.data.id, b.data.type, b.data.name);
};

run().catch(e => {
  console.error("ERR", e.response?.status, e.response?.data || e.message);
  process.exit(1);
});
