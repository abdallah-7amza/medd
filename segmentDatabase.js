import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const DB_INPUT_PATH = 'docs/database.json';
const CONTENT_OUTPUT_DIR = 'docs/content';
const VERSION_FILE_PATH = path.join(CONTENT_OUTPUT_DIR, 'version.json');

// Helper to create a consistent hash from data
function createHash(data) {
    const string = JSON.stringify(data, Object.keys(data).sort());
    return crypto.createHash('md5').update(string).digest('hex');
}

// Main recursive function to process each node
async function processNode(nodeData, currentPath) {
    const nodeOutputPath = path.join(CONTENT_OUTPUT_DIR, currentPath);
    await fs.mkdir(nodeOutputPath, { recursive: true });

    const metadata = { ...nodeData, children: {}, resources: {} };
    let contentToHash = { ...nodeData, children: {}, resources: {} }; // Base content for hashing

    // 1. Process and segment resources
    if (nodeData.resources) {
        for (const resourceType in nodeData.resources) {
            const resourceDir = path.join(nodeOutputPath, `_${resourceType}`);
            await fs.mkdir(resourceDir, { recursive: true });
            metadata.resources[resourceType] = [];

            for (const item of nodeData.resources[resourceType]) {
                const itemPath = path.join(resourceDir, `${item.id}.json`);
                await fs.writeFile(itemPath, JSON.stringify(item, null, 2));
                metadata.resources[resourceType].push({ id: item.id, title: item.title });
            }
            contentToHash.resources[resourceType] = metadata.resources[resourceType];
        }
    }

    // 2. Recursively process children and collect their versions
    if (nodeData.children) {
        for (const childId in nodeData.children) {
            const childNode = nodeData.children[childId];
            const childRelativePath = path.join(currentPath, childId);
            const childVersion = await processNode(childNode, childRelativePath);
            metadata.children[childId] = {
                label: childNode.label,
                isBranch: childNode.isBranch,
                summary: childNode.summary,
                version: childVersion // Store child's version
            };
        }
        contentToHash.children = metadata.children;
    }
    
    // Clean up large content from metadata before saving
    delete metadata.markdownContent;
    delete metadata.quizData;
    delete metadata.cards;

    // 3. Calculate and add the version for the current node
    const version = createHash(contentToHash);
    metadata.version = version;

    // 4. Write the metadata file for the current node
    const metaFilePath = path.join(nodeOutputPath, 'meta.json');
    await fs.writeFile(metaFilePath, JSON.stringify(metadata, null, 2));
    
    return version; // Return the calculated version to the parent
}

// Main execution function
async function main() {
    console.log("Starting surgical database segmentation...");
    try {
        await fs.rm(CONTENT_OUTPUT_DIR, { recursive: true, force: true });
        await fs.mkdir(CONTENT_OUTPUT_DIR, { recursive: true });

        const dbContent = await fs.readFile(DB_INPUT_PATH, 'utf8');
        const database = JSON.parse(dbContent);

        const rootVersions = {};

        if (database.tree) {
            for (const uniId in database.tree) {
                // The version for each university is calculated and returned by processNode
                rootVersions[uniId] = await processNode(database.tree[uniId], uniId);
            }
        }
        
        // Write the main version file containing top-level hashes
        await fs.writeFile(VERSION_FILE_PATH, JSON.stringify({ versions: rootVersions }, null, 2));
        console.log("Root version file generated:", rootVersions);
        console.log("Surgical segmentation completed successfully!");

    } catch (error) {
        console.error("Error during database segmentation:", error);
        process.exit(1);
    }
}

main();
