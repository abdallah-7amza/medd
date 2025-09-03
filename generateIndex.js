import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

// Helper to format names as a fallback
function formatLabel(name) {
    return name.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Main recursive function to scan directories
async function scanDirectory(dirPath, isUniversity = false) {
    const node = { children: {}, resources: {} };

    // --- 1. Read metadata for the current folder ---
    if (isUniversity) {
        const metaPath = path.join(dirPath, 'meta.json');
        try {
            const metaContent = await fs.readFile(metaPath, 'utf8');
            const meta = JSON.parse(metaContent);
            node.name = meta.name || formatLabel(path.basename(dirPath));
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

    // --- 2. Scan for ALL resources ---
    // Lesson Quiz
    const quizPath = path.join(dirPath, 'quiz.json');
    try {
        const quizContent = await fs.readFile(quizPath, 'utf8');
        node.resources.lessonQuiz = JSON.parse(quizContent);
    } catch {}

    // Collection Quizzes
    const collectionQuizPath = path.join(dirPath, '_collection_quiz');
    try {
        await fs.access(collectionQuizPath);
        const files = await fs.readdir(collectionQuizPath);
        const collectionQuizzes = [];
        for (const file of files) {
            if (file.endsWith('.json')) {
                const baseName = path.basename(file, '.json');
                const jsonFilePath = path.join(collectionQuizPath, file);
                try {
                    const quizContent = await fs.readFile(jsonFilePath, 'utf8');
                    const quizObject = JSON.parse(quizContent);
                    // *** التعديل هنا: اقرأ العنوان من الملف، أو من اسم الملف كحل بديل ***
                    const title = quizObject.title || formatLabel(baseName);
                    collectionQuizzes.push({ id: baseName, title: title, quizData: quizObject });
                } catch (e) { console.error(`Error processing collection quiz ${file}:`, e); }
            }
        }
        if (collectionQuizzes.length > 0) {
            node.resources.collectionQuizzes = collectionQuizzes;
        }
    } catch {}

    // Flashcard Decks
    const flashcardsPath = path.join(dirPath, '_flashcards');
    try {
        await fs.access(flashcardsPath);
        const files = await fs.readdir(flashcardsPath);
        const flashcardDecks = [];
        for (const file of files) {
            if (file.endsWith('.json')) {
                const baseName = path.basename(file, '.json');
                const jsonFilePath = path.join(flashcardsPath, file);
                try {
                    const deckContent = await fs.readFile(jsonFilePath, 'utf8');
                    const deckObject = JSON.parse(deckContent);
                    // *** التعديل هنا: اقرأ العنوان من الملف، أو من اسم الملف كحل بديل ***
                    const title = deckObject.title || formatLabel(baseName);
                    flashcardDecks.push({ id: baseName, title: title, cards: deckObject.cards });
                } catch (e) { console.error(`Error processing flashcard deck ${file}:`, e); }
            }
        }
        if (flashcardDecks.length > 0) {
            node.resources.flashcardDecks = flashcardDecks;
        }
    } catch {}


    // --- 3. Recursively scan children directories ---
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('_') && !entry.name.startsWith('.')) {
            const childPath = path.join(dirPath, entry.name);
            node.children[entry.name] = await scanDirectory(childPath, false);
        }
    }
    
    // Determine if the node is a branch
    const hasChildren = Object.keys(node.children).length > 0;
    const hasBranchResources = node.resources && (node.resources.collectionQuizzes || node.resources.flashcardDecks);
    if (hasChildren || hasBranchResources) {
        node.isBranch = true;
    }

    if (Object.keys(node.resources).length === 0) {
        delete node.resources;
    }

    return node;
}

// Main execution function
async function main() {
    // ... (This part remains unchanged)
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
                database.tree[uniDir.name] = await scanDirectory(uniPath, true);
            }
        }
        await fs.writeFile(outputPath, JSON.stringify(database, null, 2));
        console.log(`Database generated successfully at ${outputPath}`);
    } catch (error) {
        console.error("Error generating database:", error);
        process.exit(1);
    }
}

main();
