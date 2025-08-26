import fs from 'fs/promises';

import path from 'path';



async function scanDirectory(dirPath, relativePath = '', isTopLevel = false) {

  const items = await fs.readdir(dirPath);

  const result = {

    children: {}

  };



  for (const item of items) {

    const itemPath = path.join(dirPath, item);

    const itemRelativePath = path.join(relativePath, item);

    const stats = await fs.stat(itemPath);



    if (stats.isDirectory()) {

      if (item.startsWith('_') || item.startsWith('.')) {

        if (item === '_collection_quiz') {

          const collectionQuizzes = await processCollectionQuiz(itemPath, itemRelativePath);

          if (collectionQuizzes.length > 0) {

            result.resources = result.resources || {};

            result.resources.collectionQuiz = collectionQuizzes;

          }

        }

        continue;

      }



      const subResult = await scanDirectory(itemPath, itemRelativePath, false);



      if (isTopLevel) {

        let uniName = formatName(item);

        try {

          const metaPath = path.join(itemPath, 'meta.json');

          const metaContent = await fs.readFile(metaPath, 'utf-8');

          const meta = JSON.parse(metaContent);

          if (meta.name) {

            uniName = meta.name;

          }

        } catch (error) {

          // meta.json doesn't exist or is invalid, use formatted name

        }



        result.children[item] = {

          id: item,

          name: uniName,

          path: `content/universities/${itemRelativePath}`,

          ...subResult

        };

      } else {

        result.children[item] = {

          id: item,

          label: formatName(item),

          path: `content/universities/${itemRelativePath}`,

          ...subResult

        };

      }

    } else if (stats.isFile()) {

      if (item === 'index.md') {

        result.hasIndex = true;

      } else if (item === 'quiz.json') {

        result.resources = result.resources || {};

        result.resources.lessonQuiz = {

          file: `content/universities/${itemRelativePath}`

        };

      }

    }

  }



  return result;

}



async function processCollectionQuiz(dirPath, relativePath) {

  const items = await fs.readdir(dirPath);

  const collectionQuizzes = [];



  for (const item of items) {

    if (item.endsWith('.json')) {

      const baseName = item.replace('.json', '');

      const itemPath = path.join(dirPath, item);

      const itemRelativePath = path.join(relativePath, item);

      

      // Check for corresponding CSS and JS files

      const cssPath = path.join(dirPath, `${baseName}.css`);

      const jsPath = path.join(dirPath, `${baseName}.js`);

      

      let cssFile = null;

      let jsFile = null;

      

      try {

        await fs.access(cssPath);

        cssFile = `content/universities/${path.join(relativePath, `${baseName}.css`)}`;

      } catch (error) {

        // CSS file doesn't exist

      }

      

      try {

        await fs.access(jsPath);

        jsFile = `content/universities/${path.join(relativePath, `${baseName}.js`)}`;

      } catch (error) {

        // JS file doesn't exist

      }

      

      collectionQuizzes.push({

        id: baseName,

        file: `content/universities/${itemRelativePath}`,

        css: cssFile,

        js: jsFile

      });

    }

  }



  return collectionQuizzes;

}



function formatName(name) {

  return name.replace(/[-_]/g, ' ')

    .replace(/\b\w/g, l => l.toUpperCase());

}



async function main() {

  const universitiesPath = path.join('content', 'universities');

  

  try {

    const tree = await scanDirectory(universitiesPath, '', true);

    

    const database = {

      tree: tree.children,

      generatedAt: new Date().toISOString()

    };

    

await fs.writeFile('docs/database.json', JSON.stringify(database, null, 2));
    console.log('database.json generated successfully!');

  } catch (error) {

    console.error('Error generating database.json:', error);

  }

}



main();
