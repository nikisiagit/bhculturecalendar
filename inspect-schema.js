const { Client } = require("@notionhq/client");
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envConfig = dotenv.parse(fs.readFileSync(path.resolve(__dirname, '.env.local')));
const apiKey = envConfig.NOTION_API_KEY;
const dataSourceId = envConfig.NOTION_DATABASE_ID;

const notion = new Client({ auth: apiKey });

async function inspectSchema() {
    console.log("Fetching data source schema...\n");

    try {
        // Get one item to see its properties
        const response = await notion.dataSources.query({
            data_source_id: dataSourceId,
            page_size: 1,
        });

        if (response.results.length === 0) {
            console.log("No items found in the database.");
            return;
        }

        const item = response.results[0];
        console.log("=== AVAILABLE PROPERTIES ===\n");

        Object.entries(item.properties).forEach(([key, value]) => {
            console.log(`📌 ${key}`);
            console.log(`   Type: ${value.type}`);

            // Show sample value based on type
            if (value.type === 'title' && value.title?.[0]) {
                console.log(`   Sample: "${value.title[0].plain_text}"`);
            } else if (value.type === 'rich_text' && value.rich_text?.[0]) {
                console.log(`   Sample: "${value.rich_text[0].plain_text.substring(0, 50)}..."`);
            } else if (value.type === 'date' && value.date) {
                console.log(`   Sample: ${value.date.start} - ${value.date.end || 'N/A'}`);
            } else if (value.type === 'multi_select' && value.multi_select?.length) {
                console.log(`   Sample: [${value.multi_select.map(t => t.name).join(', ')}]`);
            } else if (value.type === 'select' && value.select) {
                console.log(`   Sample: ${value.select.name}`);
            } else if (value.type === 'url' && value.url) {
                console.log(`   Sample: ${value.url}`);
            } else if (value.type === 'files' && value.files?.length) {
                console.log(`   Sample: ${value.files[0]?.file?.url || value.files[0]?.external?.url || 'file present'}`);
            }
            console.log('');
        });

    } catch (e) {
        console.error("Error:", e.message);
    }
}

inspectSchema();
