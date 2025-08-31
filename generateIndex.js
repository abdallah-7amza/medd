import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

// Helper to format names as a fallback
function formatLabel(name) {
    return name.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

async function scanDirectory(dirPath, isUniversity = false) {
    const node = { children: {} };
    // --- Metadata for the current node ---
    const indexPath = path.join(dirPath, 'index.md');
    try {
        await fs.access(indexPath);
        node.hasIndex = true;
        const fileContent = await fs.readFile(indexPath, 'utf8');
        const { data, content } = matter(fileContent);
        node.label = data.title || formatLabel(path.basename(dirPath));
        node.summary = data.summary || '';
        node.markdownContent = content;
    } catch {
        node.hasIndex = false;
        node.label = formatLabel(path.basename(dirPath));
    }

    // --- Special handling for university folders ---
    if (isUniversity) {
        const metaPath = path.join(dirPath, 'meta.json');
        try {
            const metaContent = await fs.readFile(metaPath, 'utf8');
            const meta = JSON.parse(metaContent);
            node.name = meta.name || node.label; // Use 'name' for university
        } catch {
            node.name = node.label;
        }
    }
    
    // --- Recursively scan children directories ---
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('_') && !entry.name.startsWith('.')) {
            const childPath = path.join(dirPath, entry.name);
            node.children[entry.name] = await scanDirectory(childPath);
            node.children[entry.name].id = entry.name;
            node.children[entry.name].path = childPath;
        }
    }
    return node;
}

async function main() {
    const universitiesPath = 'content/universities';
    const outputPath = 'docs/database.json';

    const database = {
        generatedAt: new Date().toISOString(),
        tree: {}
    };

    const uniDirs = await fs.readdir(universitiesPath, { withFileTypes: true });
    for (const uniDir of uniDirs) {
        if (uniDir.isDirectory()) {
            const uniPath = path.join(universitiesPath, uniDir.name);
            database.tree[uniDir.name] = await scanDirectory(uniPath, true);
        }
    }

    await fs.writeFile(outputPath, JSON.stringify(database, null, 2));
    console.log(`Database generated successfully at ${outputPath}`);
}

main().catch(error => {
    console.error("Error generating database:", error);
    process.exit(1);
});
