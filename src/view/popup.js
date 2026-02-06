import { getAgreement, setAgreement, getFullConfig, setConfig } from '../configuration';

/**
 * KeywordList Component
 * A reusable component for managing a list of keywords with drag-and-drop functionality
 * and two-way binding to a semicolon-separated string value.
 */
class KeywordList {
  constructor(listElementId, inputElementId, addButtonId) {
    this.listElement = document.getElementById(listElementId);
    this.inputElement = document.getElementById(inputElementId);
    this.addButton = document.getElementById(addButtonId);
    this.items = [];
    this.draggedItem = null;
    
    this.init();
  }

  init() {
    // Add item on button click
    this.addButton.addEventListener('click', () => this.addItem());
    
    // Add item on Enter key
    this.inputElement.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.addItem();
      }
    });
  }

  /**
   * Adds a new item to the list
   */
  addItem() {
    const value = this.inputElement.value.trimStart(); // trim left spaces
    
    // Validate: must be single line
    if (!value || value.includes('\n')) {
      return;
    }
    
    this.items.push(value);
    this.inputElement.value = '';
    this.render();
  }

  /**
   * Removes an item from the list by index
   */
  removeItem(index) {
    this.items.splice(index, 1);
    this.render();
  }

  /**
   * Sets the list items from a semicolon-separated string
   */
  setValue(stringValue) {
    if (!stringValue) {
      this.items = [];
    } else {
      this.items = stringValue
        .split(';')
        .map(item => item.trimStart())
        .filter(item => item.length > 0);
    }
    this.render();
  }

  /**
   * Gets the list items as a semicolon-separated string
   */
  getValue() {
    return this.items.join(';');
  }

  /**
   * Renders the list items
   */
  render() {
    this.listElement.innerHTML = '';
    
    this.items.forEach((item, index) => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'keyword-item';
      itemDiv.draggable = true;
      itemDiv.dataset.index = index;
      
      // Drag handle
      const dragHandle = document.createElement('div');
      dragHandle.className = 'drag-handle';
      dragHandle.innerHTML = '<span></span><span></span><span></span>';
      
      // Keyword text
      const textSpan = document.createElement('span');
      textSpan.className = 'keyword-text';
      textSpan.textContent = item;
      
      // Remove button
      const removeBtn = document.createElement('button');
      removeBtn.className = 'btn-remove';
      removeBtn.textContent = '×';
      removeBtn.type = 'button';
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeItem(index);
      });
      
      itemDiv.appendChild(dragHandle);
      itemDiv.appendChild(textSpan);
      itemDiv.appendChild(removeBtn);
      
      // Drag events
      itemDiv.addEventListener('dragstart', (e) => this.handleDragStart(e));
      itemDiv.addEventListener('dragover', (e) => this.handleDragOver(e));
      itemDiv.addEventListener('drop', (e) => this.handleDrop(e));
      itemDiv.addEventListener('dragend', (e) => this.handleDragEnd(e));
      itemDiv.addEventListener('dragleave', (e) => this.handleDragLeave(e));
      
      this.listElement.appendChild(itemDiv);
    });
  }

  /**
   * Drag and drop event handlers
   */
  handleDragStart(e) {
    this.draggedItem = e.currentTarget;
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
  }

  handleDragOver(e) {
    if (e.preventDefault) {
      e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    
    const draggedOverItem = e.currentTarget;
    if (draggedOverItem !== this.draggedItem) {
      draggedOverItem.classList.add('drag-over');
    }
    
    return false;
  }

  handleDrop(e) {
    if (e.stopPropagation) {
      e.stopPropagation();
    }
    
    const draggedOverItem = e.currentTarget;
    
    if (this.draggedItem !== draggedOverItem) {
      const draggedIndex = parseInt(this.draggedItem.dataset.index);
      const targetIndex = parseInt(draggedOverItem.dataset.index);
      
      // Reorder items array
      const [movedItem] = this.items.splice(draggedIndex, 1);
      this.items.splice(targetIndex, 0, movedItem);
      
      this.render();
    }
    
    return false;
  }

  handleDragEnd(e) {
    e.currentTarget.classList.remove('dragging');
    
    // Remove all drag-over classes
    const allItems = this.listElement.querySelectorAll('.keyword-item');
    allItems.forEach(item => item.classList.remove('drag-over'));
  }

  handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const agreeCheckbox = document.getElementById('agree-checkbox');
  const configWrapper = document.getElementById('config-wrapper');
  let loadedConfig = null;

  // Initialize KeywordList components
  const radioButtonKeywordsList = new KeywordList(
    'radio-button-keywords-list',
    'radio-button-keywords-input',
    'radio-button-keywords-add'
  );

  const dropdownKeywordsList = new KeywordList(
    'dropdown-keywords-list',
    'dropdown-keywords-input',
    'dropdown-keywords-add'
  );

  /**
   * Toggles the enabled/disabled state of the configuration tab and its contents.
   * @param {boolean} isAgreed - Whether the user has agreed to the terms.
   */
  function updateConfigState (isAgreed) {
    configWrapper.classList.toggle('disabled', !isAgreed);

    const formElements = configWrapper.querySelectorAll('input, select, button, a');
    formElements.forEach(element => {
      element.disabled = !isAgreed;
    });
  }

  // --- Agreement Tab Logic ---
  getAgreement().then((agreed) => {
    if (agreeCheckbox) {
      agreeCheckbox.checked = agreed;
    }
    updateConfigState(agreed);
  });

  if (agreeCheckbox) {
    agreeCheckbox.addEventListener('change', () => {
      const isAgreed = agreeCheckbox.checked;
      setAgreement(isAgreed);
      updateConfigState(isAgreed);
    });
  }

  // --- Tab Switching Logic ---
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (button.disabled) return;
      const tabName = button.dataset.tab;

      tabButtons.forEach((btn) => btn.classList.remove('active'));
      button.classList.add('active');

      tabContents.forEach((content) => {
        content.id === tabName ? content.classList.add('active') : content.classList.remove('active');
      });
    });
  });

  // --- Configuration Tab Logic ---
  const saveConfigBtn = document.getElementById('save-config-btn');
  const formInput = document.getElementById('form-input');
  const surveyInput = document.getElementById('survey-input');
  const profileSelect = document.getElementById('profile-select');
  const excludesInput = document.getElementById('excludes');

  /**
   * Updates the form inputs based on the selected profile in the loaded config.
   * @param {string} selectedProfile - The key of the profile to load ('profile1' or 'profile2').
   */
  function updateFormForProfile (selectedProfile) {
    if (!loadedConfig) return;

    const profileSettings = loadedConfig.profiles[selectedProfile];
    formInput.value = loadedConfig.formSelector;
    surveyInput.value = loadedConfig.surveySelector;
    
    // Set values to KeywordList components (two-way binding: string -> list)
    radioButtonKeywordsList.setValue(profileSettings.radioButtonKeywords);
    dropdownKeywordsList.setValue(profileSettings.dropdownKeywords);
    
    excludesInput.value = profileSettings.excludes;

    // Update select box selection
    profileSelect.value = selectedProfile;
  }

  // Load initial config and set up profile switching
  getFullConfig().then((config) => {
    loadedConfig = config;
    updateFormForProfile(config.activeProfile);

    profileSelect.addEventListener('change', (event) => updateFormForProfile(event.target.value));
  });

  // Save button logic
  if (saveConfigBtn) {
    saveConfigBtn.addEventListener('click', () => {
      if (!loadedConfig) return;

      const selectedProfile = profileSelect.value;

      // Update the loadedConfig object with current form values
      loadedConfig.activeProfile = selectedProfile;
      loadedConfig.formSelector = formInput.value;
      loadedConfig.surveySelector = surveyInput.value;
      
      // Get values from KeywordList components (two-way binding: list -> string)
      loadedConfig.profiles[selectedProfile].radioButtonKeywords = radioButtonKeywordsList.getValue();
      loadedConfig.profiles[selectedProfile].dropdownKeywords = dropdownKeywordsList.getValue();
      
      loadedConfig.profiles[selectedProfile].excludes = excludesInput.value;

      setConfig(loadedConfig);

      saveConfigBtn.textContent = 'Tersimpan!';
      setTimeout(() => {
        saveConfigBtn.textContent = 'Simpan';
      }, 1500);
    });
  }

  // --- Import/Export Logic ---
  const exportLink = document.getElementById('export-link');
  const importLink = document.getElementById('import-link');
  const importFileInput = document.getElementById('import-file-input');

  exportLink.addEventListener('click', (event) => {
    event.preventDefault();
    getFullConfig().then(config => {
      const configStr = JSON.stringify(config, null, 2);
      const blob = new Blob([configStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'dandelion-config.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  });

  importLink.addEventListener('click', (event) => {
    event.preventDefault();
    importFileInput.click();
  });

  importFileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedConfig = JSON.parse(e.target.result);

        // Basic validation
        if (!importedConfig.profiles || !importedConfig.activeProfile) {
          throw new Error('Invalid config file format.');
        }

        // Save and reload
        setConfig(importedConfig);
        loadedConfig = importedConfig;
        updateFormForProfile(importedConfig.activeProfile);
      } catch (error) {
      } finally {
        // Reset file input
        importFileInput.value = '';
      }
    };
    reader.readAsText(file);
  });
});
