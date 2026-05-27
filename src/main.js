import './style.css';
import { Header } from './components/Header.js';
import { ImageStudio } from './components/ImageStudio.js';

const app = document.querySelector('#app');
let contentArea;

// Router
function navigate(page) {
  if (!contentArea) return;
  contentArea.innerHTML = '';

  if (page === 'image') {
    contentArea.appendChild(ImageStudio());
  } else if (page === 'video') {
    import('./components/VideoStudio.js').then(({ VideoStudio }) => {
      contentArea.appendChild(VideoStudio());
    });
  } else if (page === 'cinema') {
    import('./components/CinemaStudio.js').then(({ CinemaStudio }) => {
      contentArea.appendChild(CinemaStudio());
    });
  } else if (page === 'lipsync') {
    import('./components/LipSyncStudio.js').then(({ LipSyncStudio }) => {
      contentArea.appendChild(LipSyncStudio());
    });
  } else if (page === 'workflows') {
    import('./components/WorkflowStudio.js').then(({ WorkflowStudio }) => {
      contentArea.appendChild(WorkflowStudio());
    });
  } else if (page === 'agents') {
    import('./components/AgentStudio.js').then(({ AgentStudio }) => {
      contentArea.appendChild(AgentStudio());
    });
  } else if (page === 'mcp-cli') {
    import('./components/McpCliStudio.js').then(({ McpCliStudio }) => {
      contentArea.appendChild(McpCliStudio());
    });
  }
}

app.innerHTML = '';
// Pass navigate to Header so links work
app.appendChild(Header(navigate));

contentArea = document.createElement('main');
contentArea.id = 'content-area';
contentArea.className = 'flex-1 relative w-full overflow-hidden flex flex-col bg-app-bg';
app.appendChild(contentArea);

// Initial Route
navigate('image');

// Event Listener for Navigation
window.addEventListener('navigate', (e) => {
  if (e.detail.page === 'settings') {
    import('./components/SettingsModal.js').then(({ SettingsModal }) => {
      document.body.appendChild(SettingsModal());
    });
  } else {
    navigate(e.detail.page);
  }
});
