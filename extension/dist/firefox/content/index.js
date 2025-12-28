console.log("[Chameleon Content] Script loaded");function r(e,c){var l,s,d;const n=document.getElementById("chameleon-overlay");n&&n.remove();const o=document.createElement("div");o.id="chameleon-overlay",o.className="chameleon-overlay",o.innerHTML=`
    <div class="chameleon-card">
      <div class="chameleon-header">
        <span class="chameleon-icon">🦎</span>
        <span class="chameleon-title">${c}</span>
        <button class="chameleon-close" id="chameleon-close">×</button>
      </div>
      <div class="chameleon-content">
        ${h(e)}
      </div>
      <div class="chameleon-footer">
        <button class="chameleon-btn chameleon-btn-copy" id="chameleon-copy">
          📋 Copy
        </button>
        <button class="chameleon-btn chameleon-btn-primary" id="chameleon-more">
          Open Full Chat
        </button>
      </div>
    </div>
  `,document.body.appendChild(o),(l=document.getElementById("chameleon-close"))==null||l.addEventListener("click",()=>{o.remove()}),(s=document.getElementById("chameleon-copy"))==null||s.addEventListener("click",()=>{navigator.clipboard.writeText(e);const a=document.getElementById("chameleon-copy");a&&(a.textContent="✓ Copied!",setTimeout(()=>{a.textContent="📋 Copy"},2e3))}),(d=document.getElementById("chameleon-more"))==null||d.addEventListener("click",()=>{chrome.runtime.sendMessage({type:"OPEN_SIDEPANEL"})});const t=a=>{a.key==="Escape"&&(o.remove(),document.removeEventListener("keydown",t))};document.addEventListener("keydown",t)}function i(e){const c=document.getElementById("chameleon-overlay");c&&c.remove();const n=document.createElement("div");n.id="chameleon-overlay",n.className="chameleon-overlay",n.innerHTML=`
    <div class="chameleon-card">
      <div class="chameleon-header">
        <span class="chameleon-icon">🦎</span>
        <span class="chameleon-title">Chameleon AI</span>
      </div>
      <div class="chameleon-content">
        <div class="chameleon-loading">
          <div class="chameleon-spinner"></div>
          <p>${e}</p>
        </div>
      </div>
    </div>
  `,document.body.appendChild(n)}function m(e){var o;const c=document.getElementById("chameleon-overlay");c&&c.remove();const n=document.createElement("div");n.id="chameleon-overlay",n.className="chameleon-overlay",n.innerHTML=`
    <div class="chameleon-card chameleon-error">
      <div class="chameleon-header">
        <span class="chameleon-icon">⚠️</span>
        <span class="chameleon-title">Error</span>
        <button class="chameleon-close" id="chameleon-close">×</button>
      </div>
      <div class="chameleon-content">
        <p>${e}</p>
        <p class="chameleon-hint">Check your API key in extension settings.</p>
      </div>
    </div>
  `,document.body.appendChild(n),(o=document.getElementById("chameleon-close"))==null||o.addEventListener("click",()=>{n.remove()})}function h(e){return e.replace(/```(\w+)?\n([\s\S]*?)```/g,'<pre><code class="language-$1">$2</code></pre>').replace(/`([^`]+)`/g,"<code>$1</code>").replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>").replace(/\*([^*]+)\*/g,"<em>$1</em>").replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2" target="_blank">$1</a>').replace(/\n/g,"<br>")}chrome.runtime.onMessage.addListener((e,c,n)=>{var o;switch(console.log("[Chameleon Content] Message received:",e.type),e.type){case"SHOW_LOADING":i(e.text);break;case"SHOW_RESPONSE":r(e.response,e.persona);break;case"SHOW_ERROR":m(e.error);break;case"GET_SELECTION":const t=((o=window.getSelection())==null?void 0:o.toString())||"";n({selectedText:t});break;default:console.warn("[Chameleon Content] Unknown message type:",e.type)}return!0});
