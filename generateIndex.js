import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

// Helper to format names as a fallback
function formatLabel(name) {
    return name.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Main recursive function to scan directories
async function scanDirectory(dirPath, isUniversity = false, depth = 0) {
    const indent = ' '.repeat(depth * 2);
    console.log(`${indent}Scanning directory: ${dirPath}`);
    
    const node = { children: {}, resources: {} };

    // --- 1. Read metadata for the current folder ---
    if (isUniversity) {
        const metaPath = path.join(dirPath, 'meta.json');
        try {
            const metaContent = await fs.readFile(metaPath, 'utf8');
            const meta = JSON.parse(metaContent);
            node.name = meta.name || formatLabel(path.basename(dirPath));
            console.log(`${indent}  - Found university name: ${node.name}`);
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
        console.log(`${indent}  - Found index.md with title: ${node.label}`);
        node.summary = data.summary || '';
        node.markdownContent = content;
    } catch {
        node.hasIndex = false;
        node.label = node.label || formatLabel(path.basename(dirPath));
    }

    // --- 2. Scan for resources ---
    const quizPath = path.join(dirPath, 'quiz.json');
    try {
        const quizContent = await fs.readFile(quizPath, 'utf8');
        node.resources.lessonQuiz = JSON.parse(quizContent);
        console.log(`${indent}  - Found lessonQuiz.json`);
    } catch {}

    const collectionQuizPath = path.join(dirPath, '_collection_quiz');
    try {
        await fs.access(collectionQuizPath);
        console.log(`${indent}  - Found _collection_quiz directory.`);
        const files = await fs.readdir(collectionQuizPath);
        const collectionQuizzes = [];
        // ... (rest of collection quiz logic remains the same)
        for (const file of files) {
            if (file.endsWith('.json')) {
                const baseName = path.basename(file, '.json');
                const jsonFilePath = path.join(collectionQuizPath, file);
                try {
                    const quizContent = await fs.readFile(jsonFilePath, 'utf8');
                    collectionQuizzes.push({ id: baseName, quizData: JSON.parse(quizContent) });
                    console.log(`${indent}    - Processed collection quiz: ${file}`);
                } catch (e) { console.error(`Error processing ${file}:`, e); }
            }
        }
        if (collectionQuizzes.length > 0) {
            node.resources.collectionQuizzes = collectionQuizzes;
        }
    } catch {}

    // --- 3. Recursively scan children directories ---
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('_') && !entry.name.startsWith('.')) {
            console.log(`${indent}  - Found child directory: ${entry.name}`);
            const childPath = path.join(dirPath, entry.name);
            node.children[entry.name] = await scanDirectory(childPath, false, depth + 1);
            node.children[entry.name].id = entry.name;
            node.children[entry.name].path = childPath.replace(/\\/g, '/');
        }
    }

    if (Object.keys(node.resources).length === 0) {
        delete node.resources;
    }

    return node;
}

// Main execution function
async function main() {
    console.log("--- Starting Database Generation ---");
    const universitiesPath = 'content/universities';
    const outputPath = 'docs/database.json';

    const database = {
        generatedAt: new Date().toISOString(),
        tree: {}
    };

    try {
        const uniDirs = await fs.readdir(universitiesPath, { withFileTypes: true });
        for (const uniDir of uniDirs) {
            if (uniDir.isDirectory()) {
                const uniPath = path.join(universitiesPath, uniDir.name);
                database.tree[uniDir.name] = await scanDirectory(uniPath, true, 1);
            }
        }
        await fs.writeFile(outputPath, JSON.stringify(database, null, 2));
        console.log("--- Database Generation Successful ---");
    } catch (error) {
        console.error("--- Error during Database Generation ---", error);
        process.exit(1);
    }
}

main();
