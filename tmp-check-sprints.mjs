import axios from "axios";
const client = axios.create({
  baseURL: "https://martinchrbuur.atlassian.net",
  auth: { username: "martin.chr.buur@gmail.com", password: "ATATT3xFfGF04mzfkV0-lWsnihZ-Swh9Y6rmD_72QZruL_ebWrCBjEnBTa6bC7V0PomlLYWo1t3c-ObTUuwQWmGhdS6Cwn9nTMo53oF65Df0QN4idb66pItVlQc4Cuzghp8z6AsgYuBY6tstDKz-MyEA5ly8H0m3DN4GrdPTp516rNz295zihqY=049C4A57" },
  headers: { Accept: "application/json", "Content-Type": "application/json" }
});

const run = async () => {
  const boards = await client.get("/rest/agile/1.0/board", { params: { projectKeyOrId: "KAN", maxResults: 50 } });
  console.log("Boards:", boards.data.values.map(b => ({id:b.id, name:b.name, type:b.type})));
  for (const b of boards.data.values) {
    try {
      const s = await client.get(`/rest/agile/1.0/board/${b.id}/sprint`, { params: { maxResults: 5 } });
      console.log(`Board ${b.id} sprint API ok, count=${s.data.values.length}`);
    } catch (e) {
      console.log(`Board ${b.id} sprint API failed:`, e.response?.status, e.response?.data?.errorMessages || e.message);
    }
  }
};

run().catch(e => {
  console.error("ERR", e.response?.status, e.response?.data || e.message);
  process.exit(1);
});
