const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('atlassian-jwt');
const request = require('request');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static('public'));

// Store for installed apps (in production, use a proper database)
const installations = new Map();

// Serve the app descriptor
app.get('/atlassian-connect.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'atlassian-connect.json'));
});

// Installation lifecycle
app.post('/installed', (req, res) => {
  const installation = req.body;
  installations.set(installation.clientKey, installation);
  console.log('App installed for:', installation.baseUrl);
  res.status(200).send('OK');
});

app.post('/uninstalled', (req, res) => {
  const installation = req.body;
  installations.delete(installation.clientKey);
  console.log('App uninstalled for:', installation.baseUrl);
  res.status(200).send('OK');
});

// JWT verification middleware
function verifyJWT(req, res, next) {
  const token = req.query.jwt;
  if (!token) {
    return res.status(401).send('Unauthorized: No JWT token');
  }

  try {
    const decoded = jwt.decode(token, null, true);
    const installation = installations.get(decoded.iss);
    
    if (!installation) {
      return res.status(401).send('Unauthorized: Installation not found');
    }

    const verified = jwt.decode(token, installation.sharedSecret);
    req.installation = installation;
    req.user = verified;
    next();
  } catch (error) {
    console.error('JWT verification failed:', error);
    res.status(401).send('Unauthorized: Invalid JWT');
  }
}

// Main text selector page
app.get('/text-selector', verifyJWT, (req, res) => {
  const pageId = req.query.pageId;
  const spaceKey = req.query.spaceKey;
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Text Selector</title>
      <script src="https://connect-cdn.atl-paas.net/all.js"></script>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 20px;
          background: #f4f5f7;
        }
        .container {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .form-group {
          margin-bottom: 15px;
        }
        label {
          display: block;
          margin-bottom: 5px;
          font-weight: 600;
          color: #172b4d;
        }
        textarea {
          width: 100%;
          min-height: 120px;
          padding: 10px;
          border: 2px solid #dfe1e6;
          border-radius: 4px;
          font-family: inherit;
          resize: vertical;
        }
        input[type="text"] {
          width: 100%;
          padding: 10px;
          border: 2px solid #dfe1e6;
          border-radius: 4px;
          font-family: inherit;
        }
        .button-group {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          margin-top: 20px;
        }
        button {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          transition: background-color 0.2s;
        }
        .primary-btn {
          background: #0052cc;
          color: white;
        }
        .primary-btn:hover {
          background: #0065ff;
        }
        .secondary-btn {
          background: #f4f5f7;
          color: #172b4d;
          border: 1px solid #dfe1e6;
        }
        .secondary-btn:hover {
          background: #ebecf0;
        }
        .instructions {
          background: #e3fcef;
          border: 1px solid #79e2a0;
          border-radius: 4px;
          padding: 15px;
          margin-bottom: 20px;
        }
        .instructions h3 {
          margin: 0 0 10px 0;
          color: #006644;
        }
        .instructions p {
          margin: 0;
          color: #006644;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="instructions">
          <h3>📝 How to use this tool:</h3>
          <p>1. Copy the text you want to add from the current page<br>
          2. Paste it in the text area below<br>
          3. Give it a title and click "Add to Homepage"</p>
        </div>
        
        <form id="textForm">
          <div class="form-group">
            <label for="title">Title for this content:</label>
            <input type="text" id="title" name="title" placeholder="Enter a descriptive title..." required>
          </div>
          
          <div class="form-group">
            <label for="selectedText">Selected text to add to homepage:</label>
            <textarea id="selectedText" name="selectedText" placeholder="Paste your selected text here..." required></textarea>
          </div>
          
          <div class="button-group">
            <button type="button" class="secondary-btn" onclick="AP.dialog.close()">Cancel</button>
            <button type="submit" class="primary-btn">Add to Homepage</button>
          </div>
        </form>
      </div>

      <script>
        document.getElementById('textForm').addEventListener('submit', function(e) {
          e.preventDefault();
          
          const title = document.getElementById('title').value;
          const selectedText = document.getElementById('selectedText').value;
          
          if (!title.trim() || !selectedText.trim()) {
            alert('Please fill in both title and text fields.');
            return;
          }
          
          // Show loading state
          const submitBtn = document.querySelector('.primary-btn');
          const originalText = submitBtn.textContent;
          submitBtn.textContent = 'Adding...';
          submitBtn.disabled = true;
          
          // Send data to backend
          fetch('/add-to-homepage', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: title,
              content: selectedText,
              sourcePageId: '${pageId}',
              spaceKey: '${spaceKey}',
              jwt: '${req.query.jwt}'
            })
          })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              AP.messages.success({
                title: 'Success!',
                body: 'Content has been added to your homepage.'
              });
              AP.dialog.close();
            } else {
              throw new Error(data.error || 'Failed to add content');
            }
          })
          .catch(error => {
            console.error('Error:', error);
            AP.messages.error({
              title: 'Error',
              body: 'Failed to add content to homepage: ' + error.message
            });
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
          });
        });
        
        // Auto-focus on the text area
        document.getElementById('selectedText').focus();
      </script>
    </body>
    </html>
  `);
});

// API endpoint to add content to homepage
app.post('/add-to-homepage', verifyJWT, async (req, res) => {
  try {
    const { title, content, sourcePageId, spaceKey } = req.body;
    const installation = req.installation;
    
    // Get user's personal space (homepage)
    const userSpaces = await getPersonalSpace(installation);
    
    if (!userSpaces || userSpaces.length === 0) {
      return res.json({ success: false, error: 'Could not find user personal space' });
    }
    
    const personalSpaceKey = userSpaces[0].key;
    
    // Create or update the "Saved Content" page
    const savedContentPage = await createOrUpdateSavedContentPage(
      installation, 
      personalSpaceKey, 
      title, 
      content, 
      sourcePageId
    );
    
    res.json({ 
      success: true, 
      pageId: savedContentPage.id,
      pageUrl: `${installation.baseUrl}/wiki/spaces/${personalSpaceKey}/pages/${savedContentPage.id}`
    });
    
  } catch (error) {
    console.error('Error adding to homepage:', error);
    res.json({ success: false, error: error.message });
  }
});

// Helper function to get user's personal space
async function getPersonalSpace(installation) {
  return new Promise((resolve, reject) => {
    const options = {
      url: `${installation.baseUrl}/wiki/rest/api/space?type=personal&limit=1`,
      headers: {
        'Authorization': `Bearer ${generateJWT(installation)}`,
        'Accept': 'application/json'
      }
    };
    
    request.get(options, (error, response, body) => {
      if (error) {
        reject(error);
        return;
      }
      
      try {
        const data = JSON.parse(body);
        resolve(data.results);
      } catch (parseError) {
        reject(parseError);
      }
    });
  });
}

// Helper function to create or update saved content page
async function createOrUpdateSavedContentPage(installation, spaceKey, title, content, sourcePageId) {
  const pageTitle = "My Saved Content";
  
  // First, try to find existing page
  const existingPage = await findPageByTitle(installation, spaceKey, pageTitle);
  
  const timestamp = new Date().toLocaleString();
  const newContentBlock = `
## ${title}
*Added on ${timestamp}*

${content}

---
`;
  
  if (existingPage) {
    // Update existing page
    const currentContent = existingPage.body.storage.value;
    const updatedContent = currentContent + newContentBlock;
    
    return updatePage(installation, existingPage.id, pageTitle, updatedContent, existingPage.version.number + 1);
  } else {
    // Create new page
    const initialContent = `# My Saved Content

This page contains content I've saved from various Confluence pages.

${newContentBlock}`;
    
    return createPage(installation, spaceKey, pageTitle, initialContent);
  }
}

// Helper function to find page by title
async function findPageByTitle(installation, spaceKey, title) {
  return new Promise((resolve, reject) => {
    const options = {
      url: `${installation.baseUrl}/wiki/rest/api/content?spaceKey=${spaceKey}&title=${encodeURIComponent(title)}&expand=body.storage,version`,
      headers: {
        'Authorization': `Bearer ${generateJWT(installation)}`,
        'Accept': 'application/json'
      }
    };
    
    request.get(options, (error, response, body) => {
      if (error) {
        reject(error);
        return;
      }
      
      try {
        const data = JSON.parse(body);
        resolve(data.results.length > 0 ? data.results[0] : null);
      } catch (parseError) {
        reject(parseError);
      }
    });
  });
}

// Helper function to create a new page
async function createPage(installation, spaceKey, title, content) {
  return new Promise((resolve, reject) => {
    const pageData = {
      type: 'page',
      title: title,
      space: {
        key: spaceKey
      },
      body: {
        storage: {
          value: content,
          representation: 'storage'
        }
      }
    };
    
    const options = {
      url: `${installation.baseUrl}/wiki/rest/api/content`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${generateJWT(installation)}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(pageData)
    };
    
    request(options, (error, response, body) => {
      if (error) {
        reject(error);
        return;
      }
      
      try {
        const data = JSON.parse(body);
        resolve(data);
      } catch (parseError) {
        reject(parseError);
      }
    });
  });
}

// Helper function to update an existing page
async function updatePage(installation, pageId, title, content, version) {
  return new Promise((resolve, reject) => {
    const pageData = {
      version: {
        number: version
      },
      title: title,
      type: 'page',
      body: {
        storage: {
          value: content,
          representation: 'storage'
        }
      }
    };
    
    const options = {
      url: `${installation.baseUrl}/wiki/rest/api/content/${pageId}`,
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${generateJWT(installation)}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(pageData)
    };
    
    request(options, (error, response, body) => {
      if (error) {
        reject(error);
        return;
      }
      
      try {
        const data = JSON.parse(body);
        resolve(data);
      } catch (parseError) {
        reject(parseError);
      }
    });
  });
}

// Helper function to generate JWT for API calls
function generateJWT(installation) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: installation.key,
    iat: now,
    exp: now + 180, // 3 minutes
    aud: installation.clientKey
  };
  
  return jwt.encode(payload, installation.sharedSecret);
}

app.listen(PORT, () => {
  console.log(`Confluence Text Selector App running on port ${PORT}`);
  console.log(`App descriptor available at: http://localhost:${PORT}/atlassian-connect.json`);
});