const { Client } = require("@notionhq/client");
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envConfig = dotenv.parse(fs.readFileSync(path.resolve(__dirname, '.env.local')));
const apiKey = envConfig.NOTION_API_KEY;
const targetId = envConfig.NOTION_DATABASE_ID;

console.log("API Key:", apiKey.substring(0, 10) + "...");
console.log("Target Database ID:", targetId);

const notion = new Client({ auth: apiKey });

async function test() {
    console.log("\n--- Testing dataSources.retrieve ---");
    try {
        const ds = await notion.dataSources.retrieve({ data_source_id: targetId });
        console.log("SUCCESS! Found data source:", ds.id);
    } catch (e) {
        console.log("dataSources.retrieve failed:", e.message);
    }

    console.log("\n--- Searching all accessible content ---");
    try {
        const search = await notion.search({ page_size: 5 });
        console.log("Found", search.results.length, "items");
        search.results.forEach(item => {
            console.log(`  - ${item.object}: ${item.id}`);
            if (item.parent) {
                console.log(`    Parent: ${item.parent.type} = ${item.parent.database_id || item.parent.page_id || item.parent.data_source_id || 'workspace'}`);
            }
        });
    } catch (e) {
        console.log("Search failed:", e.message);
    }
}

test();
