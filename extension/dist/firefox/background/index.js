import{c as k,s as A,g as p,a as f,b as w,d as g}from"../shared/personas.js";const C=[{id:"openai/gpt-4o",name:"GPT-4o",provider:"OpenAI"},{id:"openai/gpt-4o-mini",name:"GPT-4o Mini",provider:"OpenAI"},{id:"openai/gpt-4-turbo",name:"GPT-4 Turbo",provider:"OpenAI"},{id:"anthropic/claude-3.5-sonnet",name:"Claude 3.5 Sonnet",provider:"Anthropic"},{id:"anthropic/claude-3-opus",name:"Claude 3 Opus",provider:"Anthropic"},{id:"anthropic/claude-3-haiku",name:"Claude 3 Haiku",provider:"Anthropic"},{id:"google/gemini-2.0-flash-exp",name:"Gemini 2.0 Flash",provider:"Google"},{id:"google/gemini-pro-1.5",name:"Gemini 1.5 Pro",provider:"Google"},{id:"google/gemini-flash-1.5",name:"Gemini 1.5 Flash",provider:"Google"},{id:"x-ai/grok-2-vision-1212",name:"Grok 2 Vision",provider:"xAI"},{id:"meta-llama/llama-3.2-90b-vision-instruct",name:"Llama 3.2 90B Vision",provider:"Meta"},{id:"meta-llama/llama-3.2-11b-vision-instruct",name:"Llama 3.2 11B Vision",provider:"Meta"},{id:"qwen/qwen-2-vl-72b-instruct",name:"Qwen 2 VL 72B",provider:"Qwen"}];function E(t){if(C.some(o=>o.id===t))return!0;const e=["gpt-4o","gpt-4-vision","gpt-4-turbo","gpt-5","claude-3","claude-4","gemini","grok-2-vision","grok-3","grok-4","llama-3.2-vision","llama-3.2-11b-vision","llama-3.2-90b-vision","qwen-vl","qwen-2-vl","pixtral"],n=t.toLowerCase();return e.some(o=>n.includes(o))}function P(t){return E(t)?t:"anthropic/claude-3.5-sonnet"}async function W(t,e,n="Describe what you see in this image. Identify the main content, any text, images, and the overall context. Be concise but informative.",o="anthropic/claude-3.5-sonnet"){const a=E(o)?o:P(o),r=t.startsWith("data:")?t:`data:image/png;base64,${t}`;return k(e,a,n,r)}async function I(){const t=typeof browser<"u";return new Promise((e,n)=>{t?browser.tabs.captureVisibleTab(void 0,{format:"png"}).then(e).catch(n):chrome.tabs.captureVisibleTab(void 0,{format:"png"},o=>{chrome.runtime.lastError?n(new Error(chrome.runtime.lastError.message)):e(o)})})}async function M(t,e,n={}){const{maxResults:o=5,searchDepth:a="basic",includeImages:r=!1,includeDomains:s,excludeDomains:m,includeRawContent:c=!1,topic:_="general"}=n,y={api_key:e,query:t,max_results:o,search_depth:a,include_images:r,include_answer:!0,include_raw_content:c,topic:_};s&&s.length>0&&(y.include_domains=s),m&&m.length>0&&(y.exclude_domains=m);const h=await fetch("https://api.tavily.com/search",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(y)});if(!h.ok){const $=await h.json().catch(()=>({}));throw new Error($.error||`Tavily API error: ${h.status}`)}return h.json()}async function N(t){try{const e=await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(t)}&format=json&no_html=1&skip_disambig=1`);if(!e.ok)throw new Error("DuckDuckGo search failed");const n=await e.json(),o=[];if(n.Abstract&&o.push({title:n.Heading||"Summary",url:n.AbstractURL||"",content:n.Abstract}),n.RelatedTopics)for(const a of n.RelatedTopics.slice(0,5))a.Text&&a.FirstURL&&o.push({title:a.Text.split(" - ")[0]||a.Text.slice(0,50),url:a.FirstURL,content:a.Text});return{query:t,results:o,answer:n.Answer||n.Abstract||void 0}}catch(e){return console.error("[Search] DuckDuckGo error:",e),{query:t,results:[]}}}function G(t){let e="";if(t.answer&&(e+=`## AI Answer
${t.answer}

`),t.results.length>0){e+=`## Search Results

`;for(let n=0;n<t.results.length;n++){const o=t.results[n];e+=`### ${n+1}. ${o.title}
`,e+=`${o.content}
`,o.url&&(e+=`Source: ${o.url}
`),e+=`
`}}return e||"No search results found."}async function T(t,e,n){const o=e?await M(t,e,n):await N(t);return G(o)}const x=typeof browser<"u",d=x?browser.runtime:chrome.runtime,l=x?browser.contextMenus:chrome.contextMenus,u=x?browser.tabs:chrome.tabs;console.log("[Chameleon] Background script loaded");const S=[{id:"chameleon-explain",title:"💡 Explain this",category:"understand"},{id:"chameleon-explain-simple",title:"🎯 Explain like I'm 5",category:"understand"},{id:"chameleon-define",title:"📖 Define words",category:"understand"},{id:"sep1",type:"separator"},{id:"chameleon-summarize",title:"📝 Summarize",category:"analyze"},{id:"chameleon-key-points",title:"🔑 Extract key points",category:"analyze"},{id:"chameleon-pros-cons",title:"⚖️ List pros & cons",category:"analyze"},{id:"sep2",type:"separator"},{id:"chameleon-improve",title:"✨ Improve writing",category:"writing"},{id:"chameleon-fix-grammar",title:"🔧 Fix grammar & spelling",category:"writing"},{id:"chameleon-formal",title:"👔 Make formal",category:"writing"},{id:"chameleon-casual",title:"😊 Make casual",category:"writing"},{id:"chameleon-shorter",title:"✂️ Make shorter",category:"writing"},{id:"chameleon-longer",title:"📄 Expand / elaborate",category:"writing"},{id:"sep3",type:"separator"},{id:"chameleon-explain-code",title:"💻 Explain code",category:"code"},{id:"chameleon-find-bugs",title:"🐛 Find bugs",category:"code"},{id:"chameleon-optimize",title:"⚡ Optimize code",category:"code"},{id:"sep4",type:"separator"},{id:"chameleon-translate-en",title:"🇬🇧 Translate to English",category:"translate"},{id:"chameleon-translate-de",title:"🇩🇪 Translate to German",category:"translate"},{id:"chameleon-translate-es",title:"🇪🇸 Translate to Spanish",category:"translate"},{id:"chameleon-translate-fr",title:"🇫🇷 Translate to French",category:"translate"},{id:"sep5",type:"separator"},{id:"chameleon-research",title:"🔍 Research this topic",category:"research"},{id:"chameleon-search",title:"🌐 Web search",category:"research"},{id:"sep6",type:"separator"},{id:"chameleon-ask",title:"💬 Ask Chameleon...",category:"custom"}],O=[{id:"chameleon-screenshot",title:"📸 Analyze screenshot",category:"vision"},{id:"chameleon-summarize-page",title:"📄 Summarize this page",category:"page"}];async function R(){await l.removeAll(),l.create({id:"chameleon-main",title:"🦎 Chameleon AI",contexts:["selection"]});for(const t of S)t.type==="separator"?l.create({id:t.id,parentId:"chameleon-main",type:"separator",contexts:["selection"]}):l.create({id:t.id,parentId:"chameleon-main",title:t.title,contexts:["selection"]});l.create({id:"chameleon-page",title:"🦎 Chameleon AI",contexts:["page"]});for(const t of O)l.create({id:t.id,parentId:"chameleon-page",title:t.title,contexts:["page"]});console.log("[Chameleon] Context menus initialized with",S.length+O.length,"items")}function H(t,e){return{"chameleon-explain":`Explain the following text clearly and concisely:

"${e}"`,"chameleon-explain-simple":`Explain this in very simple terms, as if explaining to a child:

"${e}"`,"chameleon-define":`Define any complex or technical words in this text:

"${e}"`,"chameleon-summarize":`Summarize this text in 2-3 sentences:

"${e}"`,"chameleon-key-points":`Extract the key points from this text as a bullet list:

"${e}"`,"chameleon-pros-cons":`List the pros and cons discussed or implied in this text:

"${e}"`,"chameleon-improve":`Improve the writing of this text (clarity, flow, word choice):

"${e}"`,"chameleon-fix-grammar":`Fix any grammar, spelling, and punctuation errors in this text:

"${e}"`,"chameleon-formal":`Rewrite this text in a more formal, professional tone:

"${e}"`,"chameleon-casual":`Rewrite this text in a more casual, friendly tone:

"${e}"`,"chameleon-shorter":`Make this text shorter while keeping the main message:

"${e}"`,"chameleon-longer":`Expand on this text, adding more detail and explanation:

"${e}"`,"chameleon-explain-code":`Explain what this code does, step by step:

\`\`\`
${e}
\`\`\``,"chameleon-find-bugs":`Analyze this code for potential bugs, issues, or improvements:

\`\`\`
${e}
\`\`\``,"chameleon-optimize":`Suggest optimizations for this code:

\`\`\`
${e}
\`\`\``,"chameleon-translate-en":`Translate this to English:

"${e}"`,"chameleon-translate-de":`Translate this to German:

"${e}"`,"chameleon-translate-es":`Translate this to Spanish:

"${e}"`,"chameleon-translate-fr":`Translate this to French:

"${e}"`,"chameleon-research":`Research this topic and provide a comprehensive overview with key facts, context, and interesting details:

"${e}"`,"chameleon-search":`SEARCH_QUERY:${e}`}[t]||`Help me with this:

"${e}"`}l.onClicked.addListener(async(t,e)=>{var m;const n=t.menuItemId;if(console.log("[Chameleon] Context menu clicked:",n),!(e!=null&&e.id))return;if(n==="chameleon-screenshot"){await z(e.id);return}if(n==="chameleon-summarize-page"){await v(e.id);return}const o=t.selectionText;if(!o)return;if(n==="chameleon-ask"){await A({...await p()||{},pendingText:o});try{(m=chrome.action)!=null&&m.openPopup&&chrome.action.openPopup()}catch{i(e.id,{type:"SHOW_RESPONSE",response:"Open the Chameleon popup to continue chatting with the selected text.",persona:"Chameleon"})}return}const a=await p();if(!(a!=null&&a.apiKey)){i(e.id,{type:"SHOW_ERROR",error:"Please open the Chameleon extension and log in to your account."}),d.openOptionsPage();return}const r=f(a.selectedPersona)||w();if(n==="chameleon-search"){await D(e.id,o,a,r);return}const s=H(n,o);try{i(e.id,{type:"SHOW_LOADING",text:`${r.emoji} ${r.name} is thinking...`});const c=await g(a.apiKey,a.selectedModel||"anthropic/claude-3.5-sonnet",[{role:"user",content:s}],r.personality);i(e.id,{type:"SHOW_RESPONSE",response:c,persona:r.name,personaEmoji:r.emoji,action:n.replace("chameleon-","")})}catch(c){console.error("[Chameleon] Error:",c),i(e.id,{type:"SHOW_ERROR",error:c instanceof Error?c.message:"Something went wrong. Check your API key."})}});function i(t,e){u.sendMessage(t,e).catch(n=>{console.error("[Chameleon] Error sending message to content script:",n)})}d.onMessage.addListener((t,e,n)=>{var o,a;switch(console.log("[Chameleon] Message received:",t.type),t.type){case"GET_SELECTED_TEXT":u.query({active:!0,currentWindow:!0}).then(r=>{var s;(s=r[0])!=null&&s.id&&i(r[0].id,{type:"GET_SELECTION"})});break;case"OPEN_SIDEPANEL":chrome.sidePanel&&chrome.sidePanel.open({windowId:(o=e.tab)==null?void 0:o.windowId});break;case"CHECK_AUTH":return p().then(r=>{n({authenticated:!!(r!=null&&r.apiKey)})}),!0;case"SUMMARIZE_PAGE":u.query({active:!0,currentWindow:!0}).then(r=>{var s;(s=r[0])!=null&&s.id&&v(r[0].id)});break;case"WRITING_ASSIST":L(t.action,t.text,(a=e.tab)==null?void 0:a.id);break;default:console.warn("[Chameleon] Unknown message type:",t.type)}return!1});async function v(t){if(!t)return;const e=await p();if(!(e!=null&&e.apiKey)){i(t,{type:"SHOW_ERROR",error:"Please sign in to use this feature."});return}const n=f(e.selectedPersona)||w();i(t,{type:"SHOW_LOADING",text:`${n.emoji} Reading page content...`});try{const o=await u.sendMessage(t,{type:"GET_PAGE_CONTENT"});if(!o||!o.textContent){i(t,{type:"SHOW_ERROR",error:"Could not extract page content."});return}i(t,{type:"SHOW_LOADING",text:`${n.emoji} Summarizing "${o.title}"...`});const a=await g(e.apiKey,e.selectedModel||"anthropic/claude-3.5-sonnet",[{role:"user",content:`Please summarize the following article in a clear, concise way. Include the key points and main takeaways.

Title: ${o.title}

Content:
${o.textContent}`}],n.personality);i(t,{type:"SHOW_RESPONSE",response:a,persona:n.name,personaEmoji:n.emoji,action:"summarize"})}catch(o){console.error("[Chameleon] Summarize error:",o),i(t,{type:"SHOW_ERROR",error:o instanceof Error?o.message:"Failed to summarize page."})}}async function L(t,e,n){if(!n||!e)return;const o=await p();if(!(o!=null&&o.apiKey)){i(n,{type:"SHOW_ERROR",error:"Please sign in to use this feature."});return}const a={improve:`Improve the following text. Make it clearer, more engaging, and well-written. Return ONLY the improved text, no explanations:

${e}`,fix:`Fix any grammar, spelling, and punctuation errors in the following text. Return ONLY the corrected text, no explanations:

${e}`,shorter:`Make the following text shorter and more concise while keeping the main message. Return ONLY the shortened text, no explanations:

${e}`,formal:`Rewrite the following text in a more formal, professional tone. Return ONLY the formal version, no explanations:

${e}`,casual:`Rewrite the following text in a more casual, friendly tone. Return ONLY the casual version, no explanations:

${e}`},r=a[t]||a.improve;i(n,{type:"SHOW_LOADING",text:"Improving your text..."});try{const s=await g(o.apiKey,o.selectedModel||"anthropic/claude-3.5-sonnet",[{role:"user",content:r}],"You are a helpful writing assistant. Be concise and direct.");i(n,{type:"APPLY_WRITING_RESULT",text:s}),i(n,{type:"SHOW_RESPONSE",response:`Text ${t==="fix"?"corrected":t==="improve"?"improved":t==="shorter"?"shortened":`made ${t}`}!

${s}`,persona:"Writing Assistant",personaEmoji:"✍️"})}catch(s){console.error("[Chameleon] Writing assist error:",s),i(n,{type:"SHOW_ERROR",error:s instanceof Error?s.message:"Failed to process text."})}}async function z(t){const e=await p();if(!(e!=null&&e.apiKey)){i(t,{type:"SHOW_ERROR",error:"Please sign in to use this feature."});return}const n=f(e.selectedPersona)||w();i(t,{type:"SHOW_LOADING",text:`${n.emoji} Capturing screenshot...`});try{const o=await I();i(t,{type:"SHOW_LOADING",text:`${n.emoji} Analyzing image...`});let a=e.selectedModel||"anthropic/claude-3.5-sonnet";E(a)||(a="anthropic/claude-3.5-sonnet");const r=await W(o,e.apiKey,"Describe what you see in this screenshot. Identify the main content, any text, images, and the overall context of the page. Be concise but informative.",a);i(t,{type:"SHOW_RESPONSE",response:r,persona:n.name,personaEmoji:n.emoji,action:"screenshot"})}catch(o){console.error("[Chameleon] Screenshot analysis error:",o),i(t,{type:"SHOW_ERROR",error:o instanceof Error?o.message:"Failed to analyze screenshot."})}}async function D(t,e,n,o){i(t,{type:"SHOW_LOADING",text:`${o.emoji} Searching the web for "${e}"...`});try{const a=await T(e,n.tavilyKey);i(t,{type:"SHOW_LOADING",text:`${o.emoji} Analyzing search results...`});const r=await g(n.apiKey,n.selectedModel||"anthropic/claude-3.5-sonnet",[{role:"user",content:`Based on the following web search results, provide a helpful answer to the query: "${e}"

${a}

Provide a clear, informative response. Include relevant facts and cite sources when possible.`}],o.personality);i(t,{type:"SHOW_RESPONSE",response:r,persona:o.name,personaEmoji:o.emoji,action:"search"})}catch(a){console.error("[Chameleon] Web search error:",a),i(t,{type:"SHOW_ERROR",error:a instanceof Error?a.message:"Failed to search the web."})}}d.onInstalled.addListener(async t=>{console.log("[Chameleon] Extension installed:",t.reason),t.reason==="install"&&d.openOptionsPage(),await R()});R();
