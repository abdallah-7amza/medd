import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

// Helper function to format folder names into readable labels
function formatLabel(folderName) {
    return folderName
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Helper function to check if a file exists
async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

// Main function to generate the database index
async function generateIndex() {
    const contentPath = 'content';
    const outputPath = 'docs/database.json';
    
    // Initialize the database structure
    const database = {
        generatedAt: new Date().toISOString(),
        tree: {}
    };
    
    // Get all university directories
    const universityDirs = await fs.readdir(contentPath);
    
    for (const uniId of universityDirs) {
        const uniPath = path.join(contentPath, uniId);
        const uniStat = await fs.stat(uniPath);
        
        if (!uniStat.isDirectory()) continue;
        
        // Create university node
        database.tree[uniId] = {
            id: uniId,
            label: formatLabel(uniId),
            path: uniPath,
            children: {}
        };
        
        // Get all year directories for this university
        const yearDirs = await fs.readdir(uniPath);
        
        for (const yearId of yearDirs) {
            const yearPath = path.join(uniPath, yearId);
            const yearStat = await fs.stat(yearPath);
            
            if (!yearStat.isDirectory()) continue;
            
            // Create year node
            database.tree[uniId].children[yearId] = {
                id: yearId,
                label: formatLabel(yearId),
                path: yearPath,
                children: {}
            };
            
            // Get all specialty directories for this year
            const specialtyDirs = await fs.readdir(yearPath);
            
            for (const specialtyId of specialtyDirs) {
                const specialtyPath = path.join(yearPath, specialtyId);
                const specialtyStat = await fs.stat(specialtyPath);
                
                if (!specialtyStat.isDirectory()) continue;
                
                // Create specialty node
                database.tree[uniId].children[yearId].children[specialtyId] = {
                    id: specialtyId,
                    label: formatLabel(specialtyId),
                    path: specialtyPath,
                    children: {}
                };
                
                // Get all lesson directories for this specialty
                const lessonDirs = await fs.readdir(specialtyPath);
                
                for (const lessonId of lessonDirs) {
                    const lessonPath = path.join(specialtyPath, lessonId);
                    const lessonStat = await fs.stat(lessonPath);
                    
                    if (!lessonStat.isDirectory()) continue;
                    
                    // Check if index.md exists
                    const indexPath = path.join(lessonPath, 'index.md');
                    const hasIndex = await fileExists(indexPath);
                    
                    // Initialize lesson node
                    const lessonNode = {
                        id: lessonId,
                        label: formatLabel(lessonId),
                        path: lessonPath,
                        hasIndex,
                        children: {},
                        resources: {}
                    };
                    
                    // If index.md exists, parse frontmatter and content
                    if (hasIndex) {
                        try {
                            const fileContent = await fs.readFile(indexPath, 'utf8');
                            const parsedMatter = matter(fileContent);
                            
                            // Extract title from frontmatter or use formatted folder name
                            const title = parsedMatter.data.title || formatLabel(lessonId);
                            
                            // Extract summary from frontmatter if available
                            const summary = parsedMatter.data.summary || '';
                            
                            // Update lesson node with frontmatter data
                            lessonNode.label = title;
                            lessonNode.summary = summary;
                            lessonNode.markdownContent = parsedMatter.content;
                            
                            // Check for additional resources
                            const quizPath = path.join(lessonPath, 'quiz.json');
                            const flashcardsPath = path.join(lessonPath, 'flashcards.json');
                            
                            if (await fileExists(quizPath)) {
                                lessonNode.resources.lessonQuiz = true;
                            }
                            
                            if (await fileExists(flashcardsPath)) {
                                lessonNode.resources.lessonFlashcards = true;
                            }
                            
                        } catch (error) {
                            console.error(`Error parsing ${indexPath}:`, error);
                        }
                    }
                    
                    // Add lesson node to specialty
                    database.tree[uniId].children[yearId].children[specialtyId].children[lessonId] = lessonNode;
                }
            }
        }
    }
    
    // Write the database to file
    await fs.writeFile(outputPath, JSON.stringify(database, null, 2));
    console.log(`Database generated successfully at ${outputPath}`);
}

// Run the function
generateIndex().catch(console.error);
