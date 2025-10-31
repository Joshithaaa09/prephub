(() => {
  let isAuthenticated = false;
  let authMode = 'login';
  let currentUser = null;
  let materials = [];
  let previewMaterial = null;

  // Query selectors
  const authContainer = document.getElementById('authContainer');
  const appContent = document.getElementById('appContent');
  const authForm = document.getElementById('authForm');
  const usernameGroup = document.getElementById('usernameGroup');
  const usernameInput = document.getElementById('usernameInput');
  const emailInput = document.getElementById('emailInput');
  const passwordInput = document.getElementById('passwordInput');
  const authTitle = document.getElementById('authTitle');
  const authSubtitle = document.getElementById('authSubtitle');
  const authSubmitBtn = document.getElementById('authSubmitBtn');
  const toggleAuthText = document.getElementById('toggleAuthText');
  const toggleAuthBtn = document.getElementById('toggleAuthBtn');
  const authError = document.getElementById('authError');

  const userSection = document.getElementById('userSection');
  const usernameDisplay = document.getElementById('usernameDisplay');
  const logoutBtn = document.getElementById('logoutBtn');

  const uploadForm = document.getElementById('uploadForm');
  const uploadTitle = document.getElementById('uploadTitle');
  const uploadSubject = document.getElementById('uploadSubject');
  const uploadTopic = document.getElementById('uploadTopic');
  const uploadExamRelevance = document.getElementById('uploadExamRelevance');
  const uploadFile = document.getElementById('uploadFile');

  const searchBar = document.getElementById('searchBar');
  const materialsList = document.getElementById('materialsList');
  const materialsCount = document.getElementById('materialsCount');
  const materialsTitle = document.getElementById('materialsTitle');
  const noMaterialsMessage = document.getElementById('noMaterialsMessage');

  const previewModal = document.getElementById('previewModal');
  const previewTitle = document.getElementById('previewTitle');
  const previewBody = document.getElementById('previewBody');
  const previewClose = document.getElementById('previewClose');
  const downloadBtn = document.getElementById('downloadBtn');

  // Utility functions
  function updateAuthUI() {
    if (isAuthenticated) {
      authContainer.style.display = 'none';
      appContent.style.display = 'block';
      userSection.style.display = 'flex';
      usernameDisplay.textContent = currentUser.username;
    } else {
      authContainer.style.display = 'block';
      appContent.style.display = 'none';
      userSection.style.display = 'none';
    }
  }

  function toggleAuthMode() {
    if (authMode === 'login') {
      authMode = 'signup';
      authTitle.textContent = 'Join PrepHub';
      authSubtitle.textContent = 'Create an account to get started';
      authSubmitBtn.textContent = 'Sign Up';
      toggleAuthText.textContent = 'Already have an account?';
      toggleAuthBtn.textContent = 'Sign In';
      usernameGroup.style.display = 'block';
      usernameInput.required = true;
    } else {
      authMode = 'login';
      authTitle.textContent = 'Welcome Back';
      authSubtitle.textContent = 'Sign in to access your study materials';
      authSubmitBtn.textContent = 'Sign In';
      toggleAuthText.textContent = "Don't have an account?";
      toggleAuthBtn.textContent = 'Sign Up';
      usernameGroup.style.display = 'none';
      usernameInput.required = false;
    }
    authError.style.display = 'none';
    authForm.reset();
  }

  function isValidEmail(email) {
    return /\S+@\S+\.\S+/.test(email);
  }

  function storageKey() {
    if (!currentUser) return null;
    return `prephub_materials_${currentUser.email}`;
  }

  function loadMaterials() {
    const key = storageKey();
    if (!key) return;
    const storedMaterials = localStorage.getItem(key);
    if (storedMaterials) {
      try {
        materials = JSON.parse(storedMaterials);
      } catch {
        materials = [];
      }
    } else {
      materials = [];
    }
    renderMaterials();
  }

  function saveMaterials() {
    const key = storageKey();
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(materials));
  }

  // --- Auth handlers
  authForm.addEventListener('submit', e => {
    e.preventDefault();
    authError.style.display = 'none';

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const username = usernameInput.value.trim();

    if (!isValidEmail(email)) {
      authError.textContent = 'Please enter a valid email address.';
      authError.style.display = 'block';
      return;
    }
    if (password.length < 6) {
      authError.textContent = 'Password must be at least 6 characters.';
      authError.style.display = 'block';
      return;
    }
    if (authMode === 'signup' && !username) {
      authError.textContent = 'Username is required.';
      authError.style.display = 'block';
      return;
    }

    if (authMode === 'signup') {
      if (localStorage.getItem(`user_${email}`)) {
        authError.textContent = 'Email already exists.';
        authError.style.display = 'block';
        return;
      }
      const userObj = { username, email, password };
      localStorage.setItem(`user_${email}`, JSON.stringify(userObj));
      currentUser = { username, email };
      isAuthenticated = true;
      localStorage.setItem('prephub_authUser', JSON.stringify(currentUser));
      loadMaterials();
      updateAuthUI();
    } else {
      const userStr = localStorage.getItem(`user_${email}`);
      if (!userStr) {
        authError.textContent = 'User not found.';
        authError.style.display = 'block';
        return;
      }
      const userObj = JSON.parse(userStr);
      if (userObj.password !== password) {
        authError.textContent = 'Incorrect password.';
        authError.style.display = 'block';
        return;
      }
      currentUser = { username: userObj.username, email: userObj.email };
      isAuthenticated = true;
      localStorage.setItem('prephub_authUser', JSON.stringify(currentUser));
      loadMaterials();
      updateAuthUI();
    }
    authForm.reset();
  });

  toggleAuthBtn.addEventListener('click', () => {
    toggleAuthMode();
  });

  logoutBtn.addEventListener('click', () => {
    isAuthenticated = false;
    currentUser = null;
    materials = [];
    localStorage.removeItem('prephub_authUser');
    updateAuthUI();
    renderMaterials();
  });

  // --- Material logic
  uploadForm.addEventListener('submit', e => {
    e.preventDefault();

    if (!currentUser) {
      alert('You must be logged in to upload materials.');
      return;
    }

    const file = uploadFile.files[0];
    if (!file) {
      alert('Please select a file to upload.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64Content = ev.target.result;
      let fileType = '';
      if (file.type) {
        const typeParts = file.type.split('/');
        fileType = typeParts[typeParts.length - 1];
      } else {
        fileType = file.name.split('.').pop().toLowerCase();
        if (!fileType) fileType = 'document';
      }
      if (fileType === 'jpeg') fileType = 'jpg';

      const newMaterial = {
        id: Date.now().toString(),
        title: uploadTitle.value.trim(),
        subject: uploadSubject.value.trim(),
        topic: uploadTopic.value.trim(),
        examRelevance: uploadExamRelevance.value.trim(),
        fileName: file.name,
        fileType: fileType,
        uploadDate: new Date().toISOString(),
        uploader: currentUser.username,
        tags: [
          uploadSubject.value.trim(),
          uploadTopic.value.trim(),
          uploadExamRelevance.value.trim()
        ],
        fileContent: base64Content
      };
      materials.unshift(newMaterial);
      saveMaterials();
      renderMaterials(searchBar.value.trim());
      uploadForm.reset();
    };
    reader.readAsDataURL(file);
  });

  function renderMaterials(filter = '') {
    materialsList.innerHTML = '';
    let filtered = materials.filter(m => {
      const q = filter.toLowerCase();
      return (
        m.title.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q) ||
        m.topic.toLowerCase().includes(q) ||
        m.examRelevance.toLowerCase().includes(q) ||
        m.tags.some(tag => tag.toLowerCase().includes(q))
      );
    });
    materialsCount.textContent = filtered.length;
    materialsTitle.textContent = filter ? `Search Results (${filtered.length} items)` : `All Materials (${filtered.length} items)`;
    if (filtered.length === 0) {
      noMaterialsMessage.style.display = 'block';
    } else {
      noMaterialsMessage.style.display = 'none';
      filtered.forEach(material => {
        const card = document.createElement('div');
        card.className = 'material-card';

        const header = document.createElement('div');
        header.className = 'material-header';

        const title = document.createElement('h4');
        title.className = 'material-title';
        title.textContent = material.title;

        const fileTypeBadge = document.createElement('span');
        fileTypeBadge.className = 'tag';
        fileTypeBadge.textContent = material.fileType;

        header.appendChild(title);
        header.appendChild(fileTypeBadge);

        const info = document.createElement('p');
        info.style.color = '#6b7280';
        info.style.fontSize = '0.85rem';
        info.textContent = `Subject: ${material.subject} • Topic: ${material.topic}`;

        const uploadInfo = document.createElement('p');
        uploadInfo.style.color = '#6b7280';
        uploadInfo.style.fontSize = '0.75rem';
        const date = new Date(material.uploadDate);
        uploadInfo.textContent = `Uploaded by ${material.uploader} • ${date.toLocaleDateString()}`;

        const tagsBox = document.createElement('div');
        material.tags.forEach(t => {
          const tSpan = document.createElement('span');
          tSpan.className = 'tag';
          tSpan.textContent = t;
          tagsBox.appendChild(tSpan);
        });

        const btnRow = document.createElement('div');
        btnRow.className = 'button-row';

        const btnDownload = document.createElement('button');
        btnDownload.className = 'button-outline';
        btnDownload.textContent = 'Download';
        btnDownload.addEventListener('click', () => downloadMaterial(material));

        const btnPreview = document.createElement('button');
        btnPreview.className = 'button-outline';
        btnPreview.textContent = 'Preview';
        btnPreview.addEventListener('click', () => showPreview(material));

        btnRow.appendChild(btnDownload);
        btnRow.appendChild(btnPreview);

        card.appendChild(header);
        card.appendChild(info);
        card.appendChild(uploadInfo);
        card.appendChild(tagsBox);
        card.appendChild(btnRow);

        materialsList.appendChild(card);
      });
    }
  }

  searchBar.addEventListener('input', () => {
    const filter = searchBar.value.trim();
    renderMaterials(filter);
  });

  function showPreview(material) {
    previewMaterial = material;
    previewTitle.textContent = material.title;
    previewBody.innerHTML = '';

    if (material.fileType === 'pdf') {
      const iframe = document.createElement('iframe');
      iframe.src = material.fileContent;
      iframe.style.height = '70vh';
      iframe.style.width = '100%';
      iframe.title = material.fileName;
      previewBody.appendChild(iframe);
    } else if (
      ['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(material.fileType)
    ) {
      const img = document.createElement('img');
      img.src = material.fileContent;
      img.alt = material.fileName;
      previewBody.appendChild(img);
    } else {
      let text = "";
      try {
        if (material.fileContent.startsWith('data:')) {
          text = atob(material.fileContent.split(',')[1]);
        } else {
          text = material.fileContent;
        }
      } catch {
        text = "Could not preview file.";
      }
      const pre = document.createElement('pre');
      pre.textContent = text;
      pre.style.whiteSpace = 'pre-wrap';
      pre.style.maxHeight = '70vh';
      pre.style.overflowY = 'auto';
      previewBody.appendChild(pre);
    }
    previewModal.classList.add('active');
  }

  previewClose.addEventListener('click', () => {
    previewMaterial = null;
    previewModal.classList.remove('active');
  });
  previewModal.addEventListener('click', (e) => {
    if (e.target === previewModal) {
      previewMaterial = null;
      previewModal.classList.remove('active');
    }
  });

  function downloadMaterial(material) {
    const a = document.createElement('a');
    a.href = material.fileContent;
    a.download = material.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  downloadBtn.addEventListener('click', () => {
    if (previewMaterial) {
      downloadMaterial(previewMaterial);
    }
  });

  function init() {
    const savedUser = localStorage.getItem('prephub_authUser');
    if (savedUser) {
      currentUser = JSON.parse(savedUser);
      isAuthenticated = true;
      loadMaterials();
    }
    updateAuthUI();
  }

  init();
})();
