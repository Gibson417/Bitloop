<script>
  import { onMount, onDestroy } from 'svelte';
  
  let updateStatus = 'idle'; // 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error'
  let updateInfo = null;
  let downloadProgress = 0;
  let errorMessage = '';
  let visible = false;
  let appVersion = '';
  
  // Check if we're running in Electron
  const isElectron = typeof window !== 'undefined' && window.electronAPI?.isElectron;
  
  onMount(async () => {
    if (!isElectron) return;
    
    // Get current app version
    try {
      appVersion = await window.electronAPI.getAppVersion();
    } catch (e) {
      console.log('Could not get app version');
    }
    
    // Listen for update events
    window.electronAPI.onUpdateAvailable((info) => {
      updateStatus = 'available';
      updateInfo = info;
      visible = true;
    });
    
    window.electronAPI.onUpdateNotAvailable((info) => {
      updateStatus = 'idle';
      // Optionally show a "you're up to date" message briefly
    });
    
    window.electronAPI.onDownloadProgress((progress) => {
      updateStatus = 'downloading';
      downloadProgress = progress.percent || 0;
    });
    
    window.electronAPI.onUpdateDownloaded((info) => {
      updateStatus = 'downloaded';
      updateInfo = info;
      visible = true;
    });
    
    window.electronAPI.onUpdateError((error) => {
      updateStatus = 'error';
      errorMessage = typeof error === 'string' ? error : 'Update check failed';
      // Don't show error banner for normal "no releases" scenario
      if (!errorMessage.includes('net::') && !errorMessage.includes('ENOENT')) {
        visible = true;
        // Auto-hide error after 5 seconds
        setTimeout(() => {
          if (updateStatus === 'error') {
            visible = false;
            updateStatus = 'idle';
          }
        }, 5000);
      }
    });
  });
  
  const checkForUpdates = async () => {
    if (!isElectron) return;
    updateStatus = 'checking';
    try {
      await window.electronAPI.checkForUpdates();
    } catch (e) {
      console.error('Failed to check for updates:', e);
    }
  };
  
  const installUpdate = async () => {
    if (!isElectron) return;
    try {
      await window.electronAPI.installUpdate();
    } catch (e) {
      console.error('Failed to install update:', e);
    }
  };
  
  const dismiss = () => {
    visible = false;
  };
</script>

{#if isElectron && visible}
  <div class="update-notification" class:downloading={updateStatus === 'downloading'}>
    <div class="update-content">
      {#if updateStatus === 'available'}
        <div class="update-icon">🔄</div>
        <div class="update-text">
          <strong>Update Available</strong>
          <span>Version {updateInfo?.version || 'new'} is available. Downloading...</span>
        </div>
      {:else if updateStatus === 'downloading'}
        <div class="update-icon">⬇️</div>
        <div class="update-text">
          <strong>Downloading Update</strong>
          <span>{downloadProgress.toFixed(0)}% complete</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: {downloadProgress}%"></div>
        </div>
      {:else if updateStatus === 'downloaded'}
        <div class="update-icon">✅</div>
        <div class="update-text">
          <strong>Update Ready</strong>
          <span>Version {updateInfo?.version || 'new'} is ready to install.</span>
        </div>
        <button class="update-btn install-btn" on:click={installUpdate}>
          Restart & Install
        </button>
      {:else if updateStatus === 'error'}
        <div class="update-icon">⚠️</div>
        <div class="update-text">
          <strong>Update Error</strong>
          <span>{errorMessage}</span>
        </div>
      {/if}
      
      {#if updateStatus !== 'downloading'}
        <button class="dismiss-btn" on:click={dismiss} aria-label="Dismiss">×</button>
      {/if}
    </div>
  </div>
{/if}

{#if isElectron}
  <div class="version-info">
    v{appVersion}
  </div>
{/if}

<style>
  .update-notification {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 10000;
    max-width: 400px;
    background: linear-gradient(145deg, rgba(34, 38, 50, 0.98), rgba(26, 29, 40, 0.99));
    border: 1px solid rgba(var(--color-accent-rgb, 120, 210, 185), 0.4);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    animation: slideIn 0.3s ease-out;
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .update-content {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    position: relative;
  }
  
  .update-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
  }
  
  .update-text {
    flex: 1;
    min-width: 150px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  
  .update-text strong {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--color-accent, #78d2b9);
  }
  
  .update-text span {
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.8);
  }
  
  .progress-bar {
    width: 100%;
    height: 6px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    overflow: hidden;
  }
  
  .progress-fill {
    height: 100%;
    background: var(--color-accent, #78d2b9);
    border-radius: 3px;
    transition: width 0.2s ease;
  }
  
  .update-btn {
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
  }
  
  .install-btn {
    background: var(--color-accent, #78d2b9);
    color: #1a1d28;
  }
  
  .install-btn:hover {
    background: var(--color-accent-bright, #9bffe0);
    transform: translateY(-1px);
  }
  
  .dismiss-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 24px;
    height: 24px;
    padding: 0;
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.5);
    font-size: 1.2rem;
    cursor: pointer;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }
  
  .dismiss-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.9);
  }
  
  .version-info {
    position: fixed;
    bottom: 8px;
    left: 8px;
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.3);
    font-family: monospace;
    pointer-events: none;
    z-index: 100;
  }
  
  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .update-notification {
      animation: none;
    }
    
    .progress-fill {
      transition: none;
    }
  }
</style>
