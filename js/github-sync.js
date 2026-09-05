// =========================================================
// GITHUB API DIRECT SYNCHRONIZATION MODULE
// =========================================================

class GitHubSync {
  constructor() {
    this.owner = localStorage.getItem("alien_github_owner") || "alangarzon7";
    this.repo = localStorage.getItem("alien_github_repo") || "MultirubroAlien";
    this.branch = localStorage.getItem("alien_github_branch") || "main";
    this.tokenKey = "alien_github_token";
  }

  setRepositoryInfo(owner, repo, branch = "main") {
    if (owner) {
      this.owner = owner.trim();
      localStorage.setItem("alien_github_owner", this.owner);
    }
    if (repo) {
      this.repo = repo.trim();
      localStorage.setItem("alien_github_repo", this.repo);
    }
    if (branch) {
      this.branch = branch.trim();
      localStorage.setItem("alien_github_branch", this.branch);
    }
  }

  getToken() {
    return localStorage.getItem(this.tokenKey) || "";
  }

  setToken(token) {
    localStorage.setItem(this.tokenKey, token.trim());
  }

  isConfigured() {
    return !!this.getToken();
  }

  // Helper to convert UTF-8 string to Base64 (browser safe)
  utf8ToBase64(str) {
    return window.btoa(unescape(encodeURIComponent(str)));
  }

  // Helper to convert ArrayBuffer to Base64 safely in chunks
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000; // 32KB chunks
    let binary = '';
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
    }
    return window.btoa(binary);
  }

  // Get current SHA of a file in the repo
  async getFileSha(path) {
    const token = this.getToken();
    const url = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${path}?ref=${this.branch}&_t=${Date.now()}`;
    
    try {
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        return data.sha;
      }
      return null;
    } catch (e) {
      console.warn(`File ${path} does not exist yet or cannot fetch SHA:`, e);
      return null;
    }
  }

  // Commit and push a single file to GitHub main branch
  async commitFile(path, contentBase64, commitMessage) {
    const token = this.getToken();
    if (!token) {
      throw new Error("No hay un Token de GitHub configurado. Por favor ingrésalo en el Modo Administrador.");
    }

    const sha = await this.getFileSha(path);
    const url = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${path}`;

    const body = {
      message: commitMessage || `Update ${path} via Multirubro Alien Admin`,
      content: contentBase64,
      branch: this.branch
    };

    if (sha) {
      body.sha = sha;
    }

    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || `Error ${res.status} al guardar en GitHub`);
    }

    return await res.json();
  }

  // Upload an image file directly to the assets/ folder in GitHub
  async uploadImage(file) {
    const token = this.getToken();
    if (!token) {
      throw new Error("Configura tu Token de GitHub para subir imágenes directamente a la nube.");
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const cleanName = `upload_${Date.now()}.${ext.toLowerCase()}`;
    const targetPath = `assets/${cleanName}`;

    const buffer = await file.arrayBuffer();
    const base64 = this.arrayBufferToBase64(buffer);

    await this.commitFile(targetPath, base64, `Upload image ${cleanName} from Admin`);
    return targetPath;
  }

  // Sync entire store configuration & products database to GitHub main
  async syncDatabase(configData, productsData) {
    const token = this.getToken();
    if (!token) {
      throw new Error("Token de GitHub no configurado.");
    }

    const configJson = JSON.stringify(configData, null, 2);
    const productsJson = JSON.stringify(productsData, null, 2);

    const configBase64 = this.utf8ToBase64(configJson);
    const productsBase64 = this.utf8ToBase64(productsJson);

    // 1. Commit config.json
    await this.commitFile('data/config.json', configBase64, "Actualización de configuración y contacto desde Admin");

    // 2. Commit products.json
    await this.commitFile('data/products.json', productsBase64, "Actualización de productos, precios y stock desde Admin");

    return true;
  }
}

window.githubSync = new GitHubSync();
