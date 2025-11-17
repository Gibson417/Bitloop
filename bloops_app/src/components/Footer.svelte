<script>
  // Footer is now simplified - pattern management moved to PatternArranger
</script>

<footer class="footer" data-component="Footer">
  <div class="footer-content">
    <p class="footer-text">Bloops - Dot grid sequencer</p>
  </div>
</footer>

<style>
  .footer {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 16px 24px;
    color: var(--color-text-muted);
    box-sizing: border-box;
    width: 100%;
  }

  .footer-content {
    text-align: center;
  }

  .footer-text {
    margin: 0;
    font-size: 0.75rem;
    opacity: 0.6;
  }

  @media (max-width: 640px) {
    .footer {
      padding: 18px 18px 24px;
    }
  }
</style>
