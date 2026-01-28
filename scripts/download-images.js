const { Client } = require("@notionhq/client");
const fs = require("fs");
const path = require("path");
const https = require("https");
require("dotenv").config();
require("dotenv").config({ path: '.env.local' });

const notion = new Client({
    auth: process.env.NOTION_API_KEY,
});

async function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const get = (currentUrl) => {
            https.get(currentUrl, (response) => {
                // Handle redirects
                if (response.statusCode === 301 || response.statusCode === 302) {
                    if (response.headers.location) {
                        get(response.headers.location);
                        return;
                    }
                }

                if (response.statusCode === 200) {
                    const file = fs.createWriteStream(filepath);
                    response.pipe(file);
                    file.on('finish', () => {
                        file.close(resolve);
                    });
                    file.on('error', (err) => {
                        fs.unlink(filepath, () => { });
                        reject(err);
                    });
                } else {
                    response.resume(); // Consume response to free memory
                    reject(new Error(`Server responded with ${response.statusCode}: ${response.statusMessage}`));
                }
            }).on('error', (err) => {
                fs.unlink(filepath, () => { });
                reject(err);
            });
        };
        get(url);
    });
}

async function main() {
    console.log("Starting image sync...");
    const dbId = process.env.NOTION_DATABASE_ID;

    if (!process.env.NOTION_API_KEY) {
        throw new Error("NOTION_API_KEY is missing. Cannot download images.");
    }
    if (!dbId) {
        throw new Error("NOTION_DATABASE_ID is missing. Cannot download images.");
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
            let url = null;
            if (page.cover) {
                if (page.cover.type === 'file') {
                    url = page.cover.file.url;
                } else if (page.cover.type === 'external') {
                    const extUrl = page.cover.external.url;
                    // Download external images if they are from S3/Notion (likely expiring)
                    if (extUrl.includes('amazonaws.com') || extUrl.includes('notion.so') || extUrl.includes('notion-static.com')) {
                        url = extUrl;
                    }
                }
            }

            if (url) {
                // Basic extension detection
                let ext = 'jpg';
                const cleanUrl = url.split('?')[0];
                if (cleanUrl.includes('.png')) ext = 'png';
                else if (cleanUrl.includes('.jpeg')) ext = 'jpeg';
                else if (cleanUrl.includes('.webp')) ext = 'webp';
                else if (cleanUrl.includes('.gif')) ext = 'gif';

                const filename = `${page.id}.${ext}`;
                const filepath = path.join(publicDir, filename);
                const publicPath = `/images/events/${filename}`;

                try {
                    await downloadImage(url, filepath);
                    imageMap[page.id] = publicPath;
                    imageMap[page.id.replace(/-/g, '')] = publicPath; // Store dashless version too
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
