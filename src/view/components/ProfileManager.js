export class ProfileManager {
  constructor(containerId, profiles, activeProfile, callbacks) {
    this.container = document.getElementById(containerId);
    this.profiles = profiles;
    this.activeProfile = activeProfile;
    this.callbacks = callbacks || {};

    if (!this.container) {
      throw new Error(`Container element with id "${containerId}" not found`);
    }

    this.init();
  }

  init() {
    this.render();
  }

  getProfileDisplayName(key) {
    const profile = this.profiles[key];
    if (profile && profile.name) return profile.name;
    if (key === 'profile1') return 'Profile 1';
    if (key === 'profile2') return 'Profile 2';
    return key;
  }

  addProfile(name) {
    const keys = Object.keys(this.profiles);
    if (keys.length >= 5) return;

    let i = 1;
    while (this.profiles[`profile${i}`]) i++;
    const key = `profile${i}`;

    this.profiles[key] = {
      name: name.trim(),
      formSkrining: {
        url: '',
        scrollToButton: true,
        radioButtonKeywords: '',
        dropdownKeywords: '',
        excludes: '',
        pinneds: {},
        respectInput: false,
        ensureFill: false,
      },
      notChecked: {
        url: '',
        notCheckedList: '',
        automationDelay: 2000,
        itemDelay: 1000,
        reloadDelay: 1000,
        domTimeout: 5000,
      },
      skrining: { url: '' },
      zenMode: { domTimeout: 5000, enabled: false, timeout: 5000 },
    };

    this.render();
    if (this.callbacks.onChange) this.callbacks.onChange();
  }

  removeProfile(key) {
    const keys = Object.keys(this.profiles);
    if (keys.length <= 1) return;

    const wasActive = this.activeProfile === key;
    delete this.profiles[key];

    if (wasActive) {
      this.activeProfile = Object.keys(this.profiles)[0];
    }

    this.render();
    if (this.callbacks.onChange) this.callbacks.onChange();
    if (wasActive && this.callbacks.onSwitch) {
      this.callbacks.onSwitch(this.activeProfile);
    }
  }

  renameProfile(key, newName) {
    this.profiles[key].name = newName.trim();
    this.render();
    if (this.callbacks.onChange) this.callbacks.onChange();
  }

  duplicateProfile(key) {
    const keys = Object.keys(this.profiles);
    if (keys.length >= 5) return;

    let i = 1;
    while (this.profiles[`profile${i}`]) i++;
    const newKey = `profile${i}`;

    const source = this.profiles[key];
    const clone = structuredClone(source);

    let newName = `${source.name} (copy)`;
    let counter = 2;
    while (Object.values(this.profiles).some((p) => p.name === newName)) {
      newName = `${source.name} (copy ${counter})`;
      counter++;
    }
    clone.name = newName;

    this.profiles[newKey] = clone;
    this.render();
    if (this.callbacks.onChange) this.callbacks.onChange();
  }

  switchProfile(key) {
    if (key === this.activeProfile) return;
    this.activeProfile = key;
    this.render();
    if (this.callbacks.onSwitch) this.callbacks.onSwitch(key);
  }

  render() {
    this.container.replaceChildren();

    const keys = Object.keys(this.profiles);

    const cardList = document.createElement('div');
    cardList.className = 'pm-card-list';

    keys.forEach((key) => {
      const card = document.createElement('div');
      card.className = 'pm-card' + (key === this.activeProfile ? ' active' : '');
      card.dataset.profile = key;

      const indicator = document.createElement('span');
      indicator.className = 'pm-indicator';
      indicator.textContent = '●';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'pm-name';
      nameSpan.textContent = this.getProfileDisplayName(key);

      const editBtn = document.createElement('button');
      editBtn.className = 'pm-btn-edit';
      editBtn.textContent = '✏️';
      editBtn.title = 'Ubah nama';

      const duplicateBtn = document.createElement('button');
      duplicateBtn.className = 'pm-btn-duplicate';
      duplicateBtn.textContent = '📋';
      duplicateBtn.title = 'Duplikat profile';

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'pm-btn-delete';
      deleteBtn.textContent = '🗑️';
      deleteBtn.title = 'Hapus profile';

      card.addEventListener('click', (e) => {
        if (
          e.target.closest('.pm-btn-edit') ||
          e.target.closest('.pm-btn-duplicate') ||
          e.target.closest('.pm-btn-delete')
        )
          return;
        this.switchProfile(key);
      });

      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.startInlineRename(nameSpan, key);
      });

      duplicateBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleDuplicate(key);
      });

      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleDelete(key);
      });

      card.appendChild(indicator);
      card.appendChild(nameSpan);
      card.appendChild(editBtn);
      card.appendChild(duplicateBtn);
      card.appendChild(deleteBtn);
      cardList.appendChild(card);
    });

    this.container.appendChild(cardList);

    if (keys.length < 5) {
      const addRow = document.createElement('div');
      addRow.className = 'pm-add-row';

      const addInput = document.createElement('input');
      addInput.type = 'text';
      addInput.className = 'pm-add-input';
      addInput.placeholder = 'Nama profile baru...';
      addInput.maxLength = 30;

      const addBtn = document.createElement('button');
      addBtn.className = 'pm-btn-add';
      addBtn.textContent = '+';
      addBtn.title = 'Tambah profile';

      const handleAdd = () => {
        const name = addInput.value.trim();
        if (!name) return;
        this.addProfile(name);
        addInput.value = '';
        addInput.focus();
      };

      addBtn.addEventListener('click', handleAdd);
      addInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleAdd();
        }
      });

      addRow.appendChild(addInput);
      addRow.appendChild(addBtn);
      this.container.appendChild(addRow);
    }
  }

  startInlineRename(nameSpan, key) {
    const currentName = this.getProfileDisplayName(key);

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'pm-rename-input';
    input.value = currentName;
    input.maxLength = 30;

    nameSpan.replaceWith(input);
    input.focus();
    input.select();

    const finishRename = () => {
      const newName = input.value.trim();
      if (newName && newName !== currentName) {
        this.renameProfile(key, newName);
      } else {
        this.render();
      }
    };

    input.addEventListener('blur', finishRename);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        input.blur();
      }
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.render();
      }
    });
  }

  handleDuplicate(key) {
    this.duplicateProfile(key);
  }

  handleDelete(key) {
    if (!confirm(`Hapus profile "${this.getProfileDisplayName(key)}"?`)) return;
    this.removeProfile(key);
  }
}
