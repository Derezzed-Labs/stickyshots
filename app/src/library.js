const gallery = document.getElementById('gallery');
const emptyMsg = document.getElementById('empty');
const clearLibraryBtn = document.getElementById('clearLibraryBtn');
const themeToggle = document.getElementById('themeToggle');
const themeToggleThumb = document.getElementById('themeToggleThumb');

// Window controls
const minBtn = document.getElementById('minBtn');
const maxBtn = document.getElementById('maxBtn');
const closeBtn = document.getElementById('closeBtn');
minBtn.addEventListener('click', () => window.library.minimize());
maxBtn.addEventListener('click', () => window.library.maximize());
closeBtn.addEventListener('click', () => window.library.close());

window.library.onMaximizedState((isMaximized) => {
  if (isMaximized) {
    maxBtn.setAttribute('title', 'Restore');
  } else {
    maxBtn.setAttribute('title', 'Maximize');
  }
});

let currentImages = [];

// Wire the Clear Library button
clearLibraryBtn.addEventListener('click', () => {
  window.library.clearLibrary();
});

// Dark/Light Mode Toggle Logic
let isDarkMode = true; // Default to dark as per html class="dark"
themeToggle.addEventListener('click', () => {
  isDarkMode = !isDarkMode;
  const htmlEl = document.documentElement;
  
  if (isDarkMode) {
    htmlEl.classList.add('dark');
    themeToggle.setAttribute('aria-checked', 'true');
    themeToggleThumb.classList.remove('translate-x-1');
    themeToggleThumb.classList.add('translate-x-5');
  } else {
    htmlEl.classList.remove('dark');
    themeToggle.setAttribute('aria-checked', 'false');
    themeToggleThumb.classList.remove('translate-x-5');
    themeToggleThumb.classList.add('translate-x-1');
  }
});

// Listen for updates from Main process
window.library.onData(({ images }) => {
  currentImages = images;
  renderGallery();
});

function renderGallery() {
  if (currentImages.length === 0) {
    gallery.style.display = 'none';
    emptyMsg.style.display = 'flex';
    return;
  }

  gallery.style.display = 'grid';
  emptyMsg.style.display = 'none';

  gallery.innerHTML = currentImages.map((img) => {
    // Determine pin style (design has a pinned style with glowing blue border)
    const cardBorderClass = img.isActive 
      ? 'border-electric-blue/50 shadow-[0_0_15px_rgba(88,101,242,0.1)]' 
      : 'border-gray-200 dark:border-border-subtle shadow-sm hover:border-gray-300 dark:hover:border-border-highlight hover:shadow-lg';
    
    // Pinned indicator badge
    const pinnedBadge = img.isActive 
      ? `<div class="absolute top-4 left-4 z-10 bg-electric-blue rounded-full p-1 shadow-md">
           <span class="material-symbols-outlined text-[14px] text-white" data-icon="push_pin" data-weight="fill" style="font-variation-settings: 'FILL' 1;">push_pin</span>
         </div>` 
      : '';

    // Action buttons inside hover overlay
    const pinActionBtn = img.isActive
      ? `<button onclick="repin('${img.id}'); event.stopPropagation();" class="pointer-events-auto flex items-center justify-center w-8 h-8 rounded-full bg-electric-blue text-white hover:bg-electric-blue/80 backdrop-blur-md transition-colors" title="Unpin">
           <span class="material-symbols-outlined text-[16px]" data-icon="push_pin" data-weight="fill" style="font-variation-settings: 'FILL' 1;">push_pin</span>
         </button>`
      : `<button onclick="repin('${img.id}'); event.stopPropagation();" class="pointer-events-auto flex items-center justify-center w-8 h-8 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-md transition-colors" title="Pin">
           <span class="material-symbols-outlined text-[16px]" data-icon="push_pin">push_pin</span>
         </button>`;

    return `
    <!-- Note Item -->
    <div class="group relative rounded-2xl overflow-hidden border ${cardBorderClass} bg-white dark:bg-charcoal-light transition-all duration-300 aspect-square">
      ${pinnedBadge}
      <img class="w-full h-full object-cover block" src="${img.fullDataUrl}" alt="StickyShot image">
      
      <!-- Hover Overlay -->
      <div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out pointer-events-none flex p-4 justify-end items-start gap-2">
        ${pinActionBtn}
        
        <button onclick="downloadImg('${img.id}'); event.stopPropagation();" class="pointer-events-auto flex items-center justify-center w-8 h-8 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-md transition-colors" title="Download">
          <span class="material-symbols-outlined text-[16px]" data-icon="download">download</span>
        </button>
        
        <!-- Delete visually present, mapped to unpin or just visual -->
        <button onclick="deleteImg('${img.id}'); event.stopPropagation();" class="pointer-events-auto flex items-center justify-center w-8 h-8 rounded-full bg-black/50 text-error hover:bg-black/70 backdrop-blur-md transition-colors" title="Delete">
          <span class="material-symbols-outlined text-[16px]" data-icon="delete">delete</span>
        </button>
      </div>
    </div>
    `;
  }).join('');
}

function downloadImg(id) {
  window.library.download(id);
}

function repin(id) {
  window.library.repin(id);
}

function deleteImg(id) {
  window.library.deleteItem(id);
}
