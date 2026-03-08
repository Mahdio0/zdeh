/**
 * filesystem.js — Virtual in-memory JSON filesystem for ZDEH
 */
const VirtualFS = (function () {
  let root = null;
  let cwd = '/';

  // ── internal helpers ──────────────────────────────────────────────────────

  function _resolvePath(p) {
    if (!p || p === '') p = cwd;
    if (p.startsWith('/')) {
      // absolute
    } else {
      p = (cwd === '/' ? '' : cwd) + '/' + p;
    }
    // normalise
    const parts = p.split('/').filter(Boolean);
    const stack = [];
    for (const part of parts) {
      if (part === '.') continue;
      if (part === '..') { stack.pop(); }
      else stack.push(part);
    }
    return '/' + stack.join('/');
  }

  function _getNode(absPath) {
    if (absPath === '/') return root;
    const parts = absPath.split('/').filter(Boolean);
    let node = root;
    for (const part of parts) {
      if (!node || node.type !== 'dir' || !node.children) return null;
      node = node.children[part] || null;
    }
    return node;
  }

  function _getParentAndName(absPath) {
    if (absPath === '/') return { parent: null, name: '' };
    const parts = absPath.split('/').filter(Boolean);
    const name = parts.pop();
    const parentPath = '/' + parts.join('/');
    const parent = _getNode(parentPath === '/' ? '/' : parentPath);
    return { parent, name };
  }

  // ── public API ────────────────────────────────────────────────────────────

  function load(fsData) {
    root = JSON.parse(JSON.stringify(fsData));
    cwd = '/';
  }

  function getCwd() { return cwd; }

  function setCwd(p) { cwd = _resolvePath(p); }

  function ls(path, showHidden) {
    const abs = _resolvePath(path || cwd);
    const node = _getNode(abs);
    if (!node) return { success: false, error: `ls: cannot access '${path}': No such file or directory` };
    if (node.type !== 'dir') return { success: false, error: `ls: '${path}': Not a directory` };
    const names = Object.keys(node.children || {});
    const filtered = showHidden ? names : names.filter(n => !n.startsWith('.'));
    return { success: true, entries: filtered.sort(), node };
  }

  function cd(path) {
    if (!path || path === '~') {
      cwd = '/';
      return { success: true };
    }
    const abs = _resolvePath(path);
    const node = _getNode(abs);
    if (!node) return { success: false, error: `cd: ${path}: No such file or directory` };
    if (node.type !== 'dir') return { success: false, error: `cd: ${path}: Not a directory` };
    cwd = abs;
    return { success: true };
  }

  function cat(path) {
    const abs = _resolvePath(path);
    const node = _getNode(abs);
    if (!node) return { success: false, error: `cat: ${path}: No such file or directory` };
    if (node.type === 'dir') return { success: false, error: `cat: ${path}: Is a directory` };
    if (node.type === 'symlink') {
      // follow symlink
      const target = _getNode(_resolvePath(node.target));
      if (!target) return { success: false, error: `cat: ${path}: No such file or directory` };
      return { success: true, content: target.content || '' };
    }
    return { success: true, content: node.content || '' };
  }

  function mkdir(path) {
    const abs = _resolvePath(path);
    if (_getNode(abs)) return { success: false, error: `mkdir: cannot create directory '${path}': File exists` };
    const { parent, name } = _getParentAndName(abs);
    if (!parent || parent.type !== 'dir') return { success: false, error: `mkdir: cannot create directory '${path}': No such file or directory` };
    parent.children[name] = { type: 'dir', name, permissions: 'rwxr-xr-x', children: {} };
    return { success: true };
  }

  function touch(path) {
    const abs = _resolvePath(path);
    const existing = _getNode(abs);
    if (existing) return { success: true }; // update mtime (no-op in virtual FS)
    const { parent, name } = _getParentAndName(abs);
    if (!parent || parent.type !== 'dir') return { success: false, error: `touch: cannot touch '${path}': No such file or directory` };
    parent.children[name] = { type: 'file', name, permissions: 'rw-r--r--', content: '' };
    return { success: true };
  }

  function cp(src, dest) {
    const absSrc = _resolvePath(src);
    const srcNode = _getNode(absSrc);
    if (!srcNode) return { success: false, error: `cp: cannot stat '${src}': No such file or directory` };
    const absDest = _resolvePath(dest);
    const destNode = _getNode(absDest);
    let targetPath = absDest;
    if (destNode && destNode.type === 'dir') {
      targetPath = absDest + (absDest === '/' ? '' : '/') + srcNode.name;
    }
    const { parent, name } = _getParentAndName(targetPath);
    if (!parent) return { success: false, error: `cp: cannot copy to '${dest}'` };
    parent.children[name] = JSON.parse(JSON.stringify(srcNode));
    parent.children[name].name = name;
    return { success: true };
  }

  function mv(src, dest) {
    const result = cp(src, dest);
    if (!result.success) return result;
    const absSrc = _resolvePath(src);
    const { parent, name } = _getParentAndName(absSrc);
    if (parent) delete parent.children[name];
    return { success: true };
  }

  function rm(path, recursive) {
    const abs = _resolvePath(path);
    const node = _getNode(abs);
    if (!node) return { success: false, error: `rm: cannot remove '${path}': No such file or directory` };
    if (node.type === 'dir' && !recursive) return { success: false, error: `rm: cannot remove '${path}': Is a directory` };
    const { parent, name } = _getParentAndName(abs);
    if (!parent) return { success: false, error: `rm: cannot remove '${path}'` };
    delete parent.children[name];
    return { success: true };
  }

  function rmdir(path) {
    const abs = _resolvePath(path);
    const node = _getNode(abs);
    if (!node) return { success: false, error: `rmdir: failed to remove '${path}': No such file or directory` };
    if (node.type !== 'dir') return { success: false, error: `rmdir: failed to remove '${path}': Not a directory` };
    if (Object.keys(node.children || {}).length > 0) return { success: false, error: `rmdir: failed to remove '${path}': Directory not empty` };
    const { parent, name } = _getParentAndName(abs);
    if (!parent) return { success: false, error: `rmdir: cannot remove '${path}'` };
    delete parent.children[name];
    return { success: true };
  }

  function chmod(mode, path) {
    const abs = _resolvePath(path);
    const node = _getNode(abs);
    if (!node) return { success: false, error: `chmod: cannot access '${path}': No such file or directory` };
    // store the mode string for display
    node.mode = mode;
    return { success: true };
  }

  function grep(pattern, path) {
    if (path) {
      const abs = _resolvePath(path);
      const node = _getNode(abs);
      if (!node) return { success: false, error: `grep: ${path}: No such file or directory` };
      if (node.type === 'dir') return { success: false, error: `grep: ${path}: Is a directory` };
      const content = node.content || '';
      try {
        // Avoid 'g' flag in filter to prevent lastIndex state issues; use 'i' only
        const re = new RegExp(pattern, 'i');
        const matches = content.split('\n').filter(line => re.test(line));
        return { success: true, matches };
      } catch (e) {
        return { success: false, error: `grep: invalid regex: ${pattern}` };
      }
    }
    return { success: false, error: 'grep: no file specified' };
  }

  function find(startPath, name) {
    const abs = _resolvePath(startPath || cwd);
    const startNode = _getNode(abs);
    if (!startNode) return { success: false, error: `find: '${startPath}': No such file or directory` };
    const results = [];
    function traverse(node, path) {
      if (!node) return;
      if (!name || node.name === name) results.push(path);
      if (node.type === 'dir') {
        for (const [childName, child] of Object.entries(node.children || {})) {
          traverse(child, path + (path === '/' ? '' : '/') + childName);
        }
      }
    }
    traverse(startNode, abs);
    return { success: true, results };
  }

  function ln(target, linkName) {
    const absTarget = _resolvePath(target);
    const absLink = _resolvePath(linkName);
    const { parent, name } = _getParentAndName(absLink);
    if (!parent) return { success: false, error: `ln: failed to create symbolic link '${linkName}'` };
    parent.children[name] = { type: 'symlink', name, target: absTarget, permissions: 'lrwxrwxrwx' };
    return { success: true };
  }

  function exists(path) {
    return !!_getNode(_resolvePath(path));
  }

  function getNode(path) {
    return _getNode(_resolvePath(path));
  }

  function getResolved(path) {
    return _resolvePath(path);
  }

  return { load, getCwd, setCwd, ls, cd, cat, mkdir, touch, cp, mv, rm, rmdir, chmod, grep, find, ln, exists, getNode, getResolved };
})();
