document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const notesList = document.getElementById('notes-list');
    const addNoteBtn = document.getElementById('add-note-btn');
    const searchInput = document.getElementById('search-input');
    
    const welcomeScreen = document.getElementById('welcome-screen');
    const editorScreen = document.getElementById('editor-screen');
    
    const noteTitleInput = document.getElementById('note-title');
    const noteContentInput = document.getElementById('note-content');
    const deleteNoteBtn = document.getElementById('delete-note-btn');
    const saveStatus = document.getElementById('save-status');

    // State
    let notes = JSON.parse(localStorage.getItem('notepad_notes')) || [];
    let currentNoteId = null;
    let saveTimeout = null;

    // Initialize
    renderNotesList();
    if (notes.length === 0) {
        welcomeScreen.classList.add('active');
    } else {
        welcomeScreen.classList.add('active');
    }

    // Event Listeners
    addNoteBtn.addEventListener('click', createNote);
    deleteNoteBtn.addEventListener('click', deleteCurrentNote);
    searchInput.addEventListener('input', () => renderNotesList(searchInput.value));
    
    noteTitleInput.addEventListener('input', handleNoteInput);
    noteContentInput.addEventListener('input', handleNoteInput);

    // Functions
    function createNote() {
        const newNote = {
            id: Date.now().toString(),
            title: '',
            content: '',
            updatedAt: new Date().toISOString()
        };
        
        notes.unshift(newNote); // Add to beginning
        saveNotes();
        selectNote(newNote.id);
        renderNotesList();
        
        // Focus on title
        setTimeout(() => {
            noteTitleInput.focus();
        }, 100);
    }

    function selectNote(id) {
        currentNoteId = id;
        const note = notes.find(n => n.id === id);
        
        if (note) {
            // Update UI
            welcomeScreen.classList.remove('active');
            editorScreen.classList.add('active');
            
            noteTitleInput.value = note.title;
            noteContentInput.value = note.content;
            
            saveStatus.textContent = 'Saved';
            
            // Re-render list to show active state
            renderNotesList(searchInput.value);
        }
    }

    function handleNoteInput() {
        if (!currentNoteId) return;
        
        saveStatus.textContent = 'Saving...';
        
        // Clear previous timeout
        if (saveTimeout) clearTimeout(saveTimeout);
        
        // Set new timeout for auto-save (debounce)
        saveTimeout = setTimeout(() => {
            updateCurrentNote();
        }, 500);
    }

    function updateCurrentNote() {
        if (!currentNoteId) return;
        
        const index = notes.findIndex(n => n.id === currentNoteId);
        if (index !== -1) {
            notes[index].title = noteTitleInput.value;
            notes[index].content = noteContentInput.value;
            notes[index].updatedAt = new Date().toISOString();
            
            // Move updated note to top
            const updatedNote = notes.splice(index, 1)[0];
            notes.unshift(updatedNote);
            
            saveNotes();
            saveStatus.textContent = 'Saved';
            renderNotesList(searchInput.value);
        }
    }

    function deleteCurrentNote() {
        if (!currentNoteId) return;
        
        if (confirm('Are you sure you want to delete this note?')) {
            notes = notes.filter(n => n.id !== currentNoteId);
            saveNotes();
            
            currentNoteId = null;
            editorScreen.classList.remove('active');
            welcomeScreen.classList.add('active');
            
            renderNotesList(searchInput.value);
        }
    }

    function saveNotes() {
        localStorage.setItem('notepad_notes', JSON.stringify(notes));
    }

    function renderNotesList(searchQuery = '') {
        notesList.innerHTML = '';
        
        const filteredNotes = notes.filter(note => {
            const query = searchQuery.toLowerCase();
            return (note.title && note.title.toLowerCase().includes(query)) || 
                   (note.content && note.content.toLowerCase().includes(query));
        });
        
        if (filteredNotes.length === 0) {
            notesList.innerHTML = `<div style="text-align: center; color: var(--text-secondary); padding: 20px;">
                ${searchQuery ? 'No notes found matching your search.' : 'No notes yet. Click New to create one!'}
            </div>`;
            return;
        }
        
        filteredNotes.forEach(note => {
            const noteEl = document.createElement('div');
            noteEl.classList.add('note-item');
            if (note.id === currentNoteId) {
                noteEl.classList.add('active');
            }
            
            const displayTitle = note.title.trim() || 'Untitled Note';
            const displayPreview = note.content.trim() || 'No additional text...';
            
            const date = new Date(note.updatedAt);
            const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const dateString = date.toLocaleDateString();
            
            // Decide whether to show just time (if today) or date
            const today = new Date();
            const isToday = date.getDate() === today.getDate() && 
                            date.getMonth() === today.getMonth() && 
                            date.getFullYear() === today.getFullYear();
                            
            const displayDate = isToday ? timeString : dateString;
            
            noteEl.innerHTML = `
                <div class="note-item-title">${escapeHTML(displayTitle)}</div>
                <div class="note-item-preview">${escapeHTML(displayPreview.substring(0, 50))}</div>
                <div class="note-item-date">${displayDate}</div>
            `;
            
            noteEl.addEventListener('click', () => selectNote(note.id));
            notesList.appendChild(noteEl);
        });
    }

    // Helper to prevent XSS
    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
});
