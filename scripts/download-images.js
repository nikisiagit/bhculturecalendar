const { Client } = require("@notionhq/client");
const fs = require("fs");
const path = require("path");
const https = require("https");

// Load environment variables
require("dotenv").config();
require("dotenv").config({ path: '.env.local' });

const notion = new Client({
    auth: process.env.NOTION_API_KEY,
});

async function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        https.get(url, (response) => {
            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close(resolve);
                });
            } else {
                file.close();
                fs.unlink(filepath, () => { });
                reject(new Error(`Server responded with ${response.statusCode}: ${response.statusMessage}`));
            }
        }).on('error', (err) => {
            fs.unlink(filepath, () => { });
            reject(err);
        });
    });
}

async function main() {
    console.log("Starting image sync...");
    const dbId = process.env.NOTION_DATABASE_ID;

    if (!process.env.NOTION_API_KEY) {
        console.warn("Skipping image sync: NOTION_API_KEY is missing");
        return;
    }
    if (!dbId) {
        console.warn("Skipping image sync: NOTION_DATABASE_ID is missing");
        return;
    }

    const publicDir = path.join(process.cwd(), 'public', 'images', 'events');
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
    }

    const mapDir = path.join(process.cwd(), 'src', 'data');
    if (!fs.existsSync(mapDir)) {
        fs.mkdirSync(mapDir, { recursive: true });
    }

    // Fetch all events
    let results = [];
    let hasMore = true;
    let cursor = undefined;

    try {
        while (hasMore) {
            const response = await notion.databases.query({
                database_id: dbId,
                start_cursor: cursor,
            });
            results.push(...response.results);
            hasMore = response.has_more;
            cursor = response.next_cursor;
        }

        console.log(`Found ${results.length} events.`);

        const imageMap = {};

        for (const page of results) {
            if (page.cover && page.cover.type === 'file') {
                const url = page.cover.file.url;
                // Basic extension detection
                let ext = 'jpg';
                if (url.includes('.png')) ext = 'png';
                else if (url.includes('.jpeg')) ext = 'jpeg';
                else if (url.includes('.webp')) ext = 'webp';

                const filename = `${page.id}.${ext}`;
                const filepath = path.join(publicDir, filename);
                const publicPath = `/images/events/${filename}`;

                try {
                    await downloadImage(url, filepath);
                    imageMap[page.id] = publicPath;
                    process.stdout.write(".");
                } catch (e) {
                    console.error(`\nFailed to download ${page.id}:`, e.message);
                }
            }
        }

        fs.writeFileSync(
            path.join(mapDir, 'image-map.json'),
            JSON.stringify(imageMap, null, 2)
        );
        console.log("\nImage sync complete.");
    } catch (error) {
        console.error("Error syncing images:", error);
        process.exit(1);
    }
}

main();
