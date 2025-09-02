import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

// ... (function formatLabel remains the same)
function formatLabel(name) {
    return name.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}


async function scanDirectory(dirPath, isUniversity = false) {
    const node = { children: {}, resources: {} };
    // ... (logic for meta.json and index.md remains the same)
    if (isUniversity) {
        const metaPath = path.join(dirPath, 'meta.json');
        try {
            const meta = JSON.parse(await fs.readFile(metaPath, 'utf8'));
            node.name = meta.name || formatLabel(path.basename(dirPath));
        } catch {
            node.name = formatLabel(path.basename(dirPath));
        }
    }
    const indexPath = path.join(dirPath, 'index.md');
    try {
        const fileContent = await fs.readFile(indexPath, 'utf8');
        const { data, content } = matter(fileContent);
        node.hasIndex = true;
        node.label = data.title || formatLabel(path.basename(dirPath));
        node.summary = data.summary || '';
        node.markdownContent = content;
    } catch {
        node.hasIndex = false;
        if (!node.label) node.label = formatLabel(path.basename(dirPath));
    }

    const lessonQuizPath = path.join(dirPath, 'quiz.json');
    try {
        const quizContent = await fs.readFile(lessonQuizPath, 'utf8');
        node.resources.lessonQuiz = JSON.parse(quizContent);
    } catch {}

    const collectionQuizPath = path.join(dirPath, '_collection_quiz');
    try {
        const files = await fs.readdir(collectionQuizPath);
        const collectionQuizzes = [];
        for (const file of files) {
            if (file.endsWith('.json')) {
                const baseName = path.basename(file, '.json');
                const jsonFilePath = path.join(collectionQuizPath, file);
                const quizContent = await fs.readFile(jsonFilePath, 'utf8');
                const quizData = JSON.parse(quizContent);
                // **THIS IS THE FIX**: Read the title from the quiz data, or format the filename as a fallback.
                collectionQuizzes.push({ 
                    id: baseName, 
                    title: quizData.title || formatLabel(baseName), // The Important Change
                    quizData: quizData 
                });
            }
        }
        if (collectionQuizzes.length > 0) {
            node.resources.collectionQuizzes = collectionQuizzes;
        }
    } catch {}

    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('_') && !entry.name.startsWith('.')) {
            const childPath = path.join(dirPath, entry.name);
            node.children[entry.name] = await scanDirectory(childPath);
        }
    }
    if (Object.keys(node.resources).length === 0) delete node.resources;
    return node;
}

// ... (function main remains the same)
async function main() {
    const database = { generatedAt: new Date().toISOString(), tree: {} };
    const universitiesPath = 'content/universities';
    try {
        const uniDirs = await fs.readdir(universitiesPath, { withFileTypes: true });
        for (const uniDir of uniDirs) {
            if (uniDir.isDirectory()) {
                const uniPath = path.join(universitiesPath, uniDir.name);
                database.tree[uniDir.name] = await scanDirectory(uniPath, true);
            }
        }
        await fs.writeFile('docs/database.json', JSON.stringify(database, null, 2));
        console.log("Database generated successfully.");
    } catch (error) {
        console.error("Error generating database:", error);
        process.exit(1);
    }
}

main();
