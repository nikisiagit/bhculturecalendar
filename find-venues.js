const { Client } = require("@notionhq/client");
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envConfig = dotenv.parse(fs.readFileSync(path.resolve(__dirname, '.env.local')));
const apiKey = envConfig.NOTION_API_KEY;

const notion = new Client({ auth: apiKey });

async function inspectVenuesDB() {
    // Try the first data source with Venue property
    const dataSourceId = "299f9c42-88ed-8197-8cf5-000b01220c73";

    console.log("Inspecting data source for venues...\n");

    try {
        const response = await notion.dataSources.query({
            data_source_id: dataSourceId,
            page_size: 5,
        });

        console.log(`Found ${response.results.length} items:\n`);

        if (response.results.length > 0) {
            const item = response.results[0];
            console.log("=== PROPERTIES ===\n");

            Object.entries(item.properties).forEach(([key, value]) => {
                console.log(`📌 ${key}: ${value.type}`);

                if (value.type === 'title' && value.title?.[0]) {
                    console.log(`   Value: "${value.title[0].plain_text}"`);
                } else if (value.type === 'rich_text' && value.rich_text?.[0]) {
                    console.log(`   Value: "${value.rich_text[0].plain_text}"`);
                } else if (value.type === 'url' && value.url) {
                    console.log(`   Value: ${value.url}`);
                } else if (value.type === 'multi_select') {
                    console.log(`   Value: [${value.multi_select?.map(s => s.name).join(', ')}]`);
                }
            });

            // Show first 3 items
            console.log("\n=== SAMPLE DATA ===\n");
            response.results.slice(0, 3).forEach((item, i) => {
                const titleKey = Object.keys(item.properties).find(k => item.properties[k].type === 'title');
                const title = titleKey ? item.properties[titleKey].title?.[0]?.plain_text : 'Untitled';
                console.log(`${i + 1}. ${title}`);
            });
        }

    } catch (e) {
        console.error("Error:", e.message);
    }
}

inspectVenuesDB();
