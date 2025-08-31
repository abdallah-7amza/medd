import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

// Helper to format names as a fallback
function formatLabel(name) {
    return name.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Main recursive function to scan directories
async function scanDirectory(dirPath, isUniversity = false) {
    const node = { children: {} };

    // --- 1. Read metadata for the current folder (from index.md or meta.json) ---
    if (isUniversity) {
        const metaPath = path.join(dirPath, 'meta.json');
        try {
            const metaContent = await fs.readFile(metaPath, 'utf8');
            const meta = JSON.parse(metaContent);
            node.name = meta.name || formatLabel(path.basename(dirPath)); // University has a 'name'
        } catch {
            node.name = formatLabel(path.basename(dirPath));
        }
    }

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
        node.label = node.label || formatLabel(path.basename(dirPath));
    }

    // --- 2. Scan for resource files (like quizzes) ---
    node.resources = {};
    const quizPath = path.join(dirPath, 'quiz.json');
    try {
        const quizContent = await fs.readFile(quizPath, 'utf8');
        node.resources.lessonQuiz = JSON.parse(quizContent);
    } catch {
        // No quiz.json found, which is fine.
    }

    // --- 3. Recursively scan children directories ---
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('_') && !entry.name.startsWith('.')) {
            const childPath = path.join(dirPath, entry.name);
            node.children[entry.name] = await scanDirectory(childPath);
            node.children[entry.name].id = entry.name;
            node.children[entry.name].path = childPath.replace(/\\/g, '/'); // Normalize path for consistency
        }
    }

    // Clean up empty resources object
    if (Object.keys(node.resources).length === 0) {
        delete node.resources;
    }

    return node;
}

// Main execution function
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
