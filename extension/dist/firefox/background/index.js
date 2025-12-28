import{s as R,g as h,a as g,b as f,c as d}from"../shared/personas.js";async function $(t,e,n="What's in this image? Describe it in detail.",o="openai/gpt-4o"){var s,c;const r=await fetch("https://openrouter.ai/api/v1/chat/completions",{method:"POST",headers:{Authorization:`Bearer ${e}`,"Content-Type":"application/json","HTTP-Referer":"https://chameleonai.chat","X-Title":"Chameleon AI Extension"},body:JSON.stringify({model:o,messages:[{role:"user",content:[{type:"text",text:n},{type:"image_url",image_url:{url:t.startsWith("data:")?t:`data:image/png;base64,${t}`}}]}],max_tokens:1e3})});if(!r.ok){const l=await r.text();throw new Error(`Vision API error: ${l}`)}return((c=(s=(await r.json()).choices[0])==null?void 0:s.message)==null?void 0:c.content)||"No analysis available"}async function _(){const t=typeof browser<"u";return t?browser.tabs:chrome.tabs,new Promise((e,n)=>{t?browser.tabs.captureVisibleTab(void 0,{format:"png"}).then(e).catch(n):chrome.tabs.captureVisibleTab(void 0,{format:"png"},o=>{chrome.runtime.lastError?n(new Error(chrome.runtime.lastError.message)):e(o)})})}const A=[{id:"openai/gpt-4o",name:"GPT-4o",provider:"OpenAI"},{id:"openai/gpt-4o-mini",name:"GPT-4o Mini",provider:"OpenAI"},{id:"anthropic/claude-3.5-sonnet",name:"Claude 3.5 Sonnet",provider:"Anthropic"},{id:"anthropic/claude-3-opus",name:"Claude 3 Opus",provider:"Anthropic"},{id:"google/gemini-pro-1.5",name:"Gemini 1.5 Pro",provider:"Google"},{id:"google/gemini-flash-1.5",name:"Gemini 1.5 Flash",provider:"Google"}];function v(t){return A.some(e=>e.id===t)}async function k(t){try{const e=await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(t)}&format=json&no_html=1&skip_disambig=1`);if(!e.ok)throw new Error("DuckDuckGo search failed");const n=await e.json(),o=[];if(n.Abstract&&o.push({title:n.Heading||"Summary",url:n.AbstractURL||"",snippet:n.Abstract}),n.RelatedTopics)for(const r of n.RelatedTopics.slice(0,5))r.Text&&r.FirstURL&&o.push({title:r.Text.split(" - ")[0]||r.Text.slice(0,50),url:r.FirstURL,snippet:r.Text});return{results:o,answer:n.Answer||n.Abstract||void 0,source:n.AbstractSource||void 0}}catch(e){return console.error("[Search] DuckDuckGo error:",e),{results:[]}}}async function C(t,e,n={}){const{searchDepth:o="basic",maxResults:r=5,includeAnswer:i=!0}=n;try{const s=await fetch("https://api.tavily.com/search",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({api_key:e,query:t,search_depth:o,max_results:r,include_answer:i})});if(!s.ok)throw new Error("Tavily search failed");const c=await s.json();return{results:(c.results||[]).map(y=>({title:y.title,url:y.url,snippet:y.content})),answer:c.answer}}catch(s){return console.error("[Search] Tavily error:",s),{results:[]}}}function P(t){let e="";if(t.answer&&(e+=`**Answer:** ${t.answer}

`),t.results.length>0){e+=`**Search Results:**
`;for(const n of t.results)e+=`- **${n.title}**: ${n.snippet}
`,n.url&&(e+=`  Source: ${n.url}
`)}return e||"No search results found."}async function W(t,e){const n=e?await C(t,e):await k(t);return P(n)}const w=typeof browser<"u",m=w?browser.runtime:chrome.runtime,p=w?browser.contextMenus:chrome.contextMenus,u=w?browser.tabs:chrome.tabs;console.log("[Chameleon] Background script loaded");const E=[{id:"chameleon-explain",title:"💡 Explain this",category:"understand"},{id:"chameleon-explain-simple",title:"🎯 Explain like I'm 5",category:"understand"},{id:"chameleon-define",title:"📖 Define words",category:"understand"},{id:"sep1",type:"separator"},{id:"chameleon-summarize",title:"📝 Summarize",category:"analyze"},{id:"chameleon-key-points",title:"🔑 Extract key points",category:"analyze"},{id:"chameleon-pros-cons",title:"⚖️ List pros & cons",category:"analyze"},{id:"sep2",type:"separator"},{id:"chameleon-improve",title:"✨ Improve writing",category:"writing"},{id:"chameleon-fix-grammar",title:"🔧 Fix grammar & spelling",category:"writing"},{id:"chameleon-formal",title:"👔 Make formal",category:"writing"},{id:"chameleon-casual",title:"😊 Make casual",category:"writing"},{id:"chameleon-shorter",title:"✂️ Make shorter",category:"writing"},{id:"chameleon-longer",title:"📄 Expand / elaborate",category:"writing"},{id:"sep3",type:"separator"},{id:"chameleon-explain-code",title:"💻 Explain code",category:"code"},{id:"chameleon-find-bugs",title:"🐛 Find bugs",category:"code"},{id:"chameleon-optimize",title:"⚡ Optimize code",category:"code"},{id:"sep4",type:"separator"},{id:"chameleon-translate-en",title:"🇬🇧 Translate to English",category:"translate"},{id:"chameleon-translate-de",title:"🇩🇪 Translate to German",category:"translate"},{id:"chameleon-translate-es",title:"🇪🇸 Translate to Spanish",category:"translate"},{id:"chameleon-translate-fr",title:"🇫🇷 Translate to French",category:"translate"},{id:"sep5",type:"separator"},{id:"chameleon-research",title:"🔍 Research this topic",category:"research"},{id:"chameleon-search",title:"🌐 Web search",category:"research"},{id:"sep6",type:"separator"},{id:"chameleon-ask",title:"💬 Ask Chameleon...",category:"custom"}],S=[{id:"chameleon-screenshot",title:"📸 Analyze screenshot",category:"vision"},{id:"chameleon-summarize-page",title:"📄 Summarize this page",category:"page"}];async function x(){await p.removeAll(),p.create({id:"chameleon-main",title:"🦎 Chameleon AI",contexts:["selection"]});for(const t of E)t.type==="separator"?p.create({id:t.id,parentId:"chameleon-main",type:"separator",contexts:["selection"]}):p.create({id:t.id,parentId:"chameleon-main",title:t.title,contexts:["selection"]});p.create({id:"chameleon-page",title:"🦎 Chameleon AI",contexts:["page"]});for(const t of S)p.create({id:t.id,parentId:"chameleon-page",title:t.title,contexts:["page"]});console.log("[Chameleon] Context menus initialized with",E.length+S.length,"items")}function N(t,e){return{"chameleon-explain":`Explain the following text clearly and concisely:

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

"${e}"`}p.onClicked.addListener(async(t,e)=>{var c;const n=t.menuItemId;if(console.log("[Chameleon] Context menu clicked:",n),!(e!=null&&e.id))return;if(n==="chameleon-screenshot"){await I(e.id);return}if(n==="chameleon-summarize-page"){await O(e.id);return}const o=t.selectionText;if(!o)return;if(n==="chameleon-ask"){await R({...await h()||{},pendingText:o});try{(c=chrome.action)!=null&&c.openPopup&&chrome.action.openPopup()}catch{a(e.id,{type:"SHOW_RESPONSE",response:"Open the Chameleon popup to continue chatting with the selected text.",persona:"Chameleon"})}return}const r=await h();if(!(r!=null&&r.apiKey)){a(e.id,{type:"SHOW_ERROR",error:"Please open the Chameleon extension and log in to your account."}),m.openOptionsPage();return}const i=g(r.selectedPersona)||f();if(n==="chameleon-search"){await H(e.id,o,r,i);return}const s=N(n,o);try{a(e.id,{type:"SHOW_LOADING",text:`${i.emoji} ${i.name} is thinking...`});const l=await d(r.apiKey,r.selectedModel||"anthropic/claude-3.5-sonnet",[{role:"user",content:s}],i.personality);a(e.id,{type:"SHOW_RESPONSE",response:l,persona:i.name,personaEmoji:i.emoji,action:n.replace("chameleon-","")})}catch(l){console.error("[Chameleon] Error:",l),a(e.id,{type:"SHOW_ERROR",error:l instanceof Error?l.message:"Something went wrong. Check your API key."})}});function a(t,e){u.sendMessage(t,e).catch(n=>{console.error("[Chameleon] Error sending message to content script:",n)})}m.onMessage.addListener((t,e,n)=>{var o,r;switch(console.log("[Chameleon] Message received:",t.type),t.type){case"GET_SELECTED_TEXT":u.query({active:!0,currentWindow:!0}).then(i=>{var s;(s=i[0])!=null&&s.id&&a(i[0].id,{type:"GET_SELECTION"})});break;case"OPEN_SIDEPANEL":chrome.sidePanel&&chrome.sidePanel.open({windowId:(o=e.tab)==null?void 0:o.windowId});break;case"CHECK_AUTH":return h().then(i=>{n({authenticated:!!(i!=null&&i.apiKey)})}),!0;case"SUMMARIZE_PAGE":u.query({active:!0,currentWindow:!0}).then(i=>{var s;(s=i[0])!=null&&s.id&&O(i[0].id)});break;case"WRITING_ASSIST":T(t.action,t.text,(r=e.tab)==null?void 0:r.id);break;default:console.warn("[Chameleon] Unknown message type:",t.type)}return!1});async function O(t){if(!t)return;const e=await h();if(!(e!=null&&e.apiKey)){a(t,{type:"SHOW_ERROR",error:"Please sign in to use this feature."});return}const n=g(e.selectedPersona)||f();a(t,{type:"SHOW_LOADING",text:`${n.emoji} Reading page content...`});try{const o=await u.sendMessage(t,{type:"GET_PAGE_CONTENT"});if(!o||!o.textContent){a(t,{type:"SHOW_ERROR",error:"Could not extract page content."});return}a(t,{type:"SHOW_LOADING",text:`${n.emoji} Summarizing "${o.title}"...`});const r=await d(e.apiKey,e.selectedModel||"anthropic/claude-3.5-sonnet",[{role:"user",content:`Please summarize the following article in a clear, concise way. Include the key points and main takeaways.

Title: ${o.title}

Content:
${o.textContent}`}],n.personality);a(t,{type:"SHOW_RESPONSE",response:r,persona:n.name,personaEmoji:n.emoji,action:"summarize"})}catch(o){console.error("[Chameleon] Summarize error:",o),a(t,{type:"SHOW_ERROR",error:o instanceof Error?o.message:"Failed to summarize page."})}}async function T(t,e,n){if(!n||!e)return;const o=await h();if(!(o!=null&&o.apiKey)){a(n,{type:"SHOW_ERROR",error:"Please sign in to use this feature."});return}const r={improve:`Improve the following text. Make it clearer, more engaging, and well-written. Return ONLY the improved text, no explanations:

${e}`,fix:`Fix any grammar, spelling, and punctuation errors in the following text. Return ONLY the corrected text, no explanations:

${e}`,shorter:`Make the following text shorter and more concise while keeping the main message. Return ONLY the shortened text, no explanations:

${e}`,formal:`Rewrite the following text in a more formal, professional tone. Return ONLY the formal version, no explanations:

${e}`,casual:`Rewrite the following text in a more casual, friendly tone. Return ONLY the casual version, no explanations:

${e}`},i=r[t]||r.improve;a(n,{type:"SHOW_LOADING",text:"Improving your text..."});try{const s=await d(o.apiKey,o.selectedModel||"anthropic/claude-3.5-sonnet",[{role:"user",content:i}],"You are a helpful writing assistant. Be concise and direct.");a(n,{type:"APPLY_WRITING_RESULT",text:s}),a(n,{type:"SHOW_RESPONSE",response:`Text ${t==="fix"?"corrected":t==="improve"?"improved":t==="shorter"?"shortened":`made ${t}`}!

${s}`,persona:"Writing Assistant",personaEmoji:"✍️"})}catch(s){console.error("[Chameleon] Writing assist error:",s),a(n,{type:"SHOW_ERROR",error:s instanceof Error?s.message:"Failed to process text."})}}async function I(t){const e=await h();if(!(e!=null&&e.apiKey)){a(t,{type:"SHOW_ERROR",error:"Please sign in to use this feature."});return}const n=g(e.selectedPersona)||f();a(t,{type:"SHOW_LOADING",text:`${n.emoji} Capturing screenshot...`});try{const o=await _();a(t,{type:"SHOW_LOADING",text:`${n.emoji} Analyzing image...`});let r=e.selectedModel||"anthropic/claude-3.5-sonnet";v(r)||(r="anthropic/claude-3.5-sonnet");const i=await $(o,e.apiKey,"Describe what you see in this screenshot. Identify the main content, any text, images, and the overall context of the page. Be concise but informative.",r);a(t,{type:"SHOW_RESPONSE",response:i,persona:n.name,personaEmoji:n.emoji,action:"screenshot"})}catch(o){console.error("[Chameleon] Screenshot analysis error:",o),a(t,{type:"SHOW_ERROR",error:o instanceof Error?o.message:"Failed to analyze screenshot."})}}async function H(t,e,n,o){a(t,{type:"SHOW_LOADING",text:`${o.emoji} Searching the web for "${e}"...`});try{const r=await W(e,n.tavilyKey);a(t,{type:"SHOW_LOADING",text:`${o.emoji} Analyzing search results...`});const i=await d(n.apiKey,n.selectedModel||"anthropic/claude-3.5-sonnet",[{role:"user",content:`Based on the following web search results, provide a helpful answer to the query: "${e}"

${r}

Provide a clear, informative response. Include relevant facts and cite sources when possible.`}],o.personality);a(t,{type:"SHOW_RESPONSE",response:i,persona:o.name,personaEmoji:o.emoji,action:"search"})}catch(r){console.error("[Chameleon] Web search error:",r),a(t,{type:"SHOW_ERROR",error:r instanceof Error?r.message:"Failed to search the web."})}}m.onInstalled.addListener(async t=>{console.log("[Chameleon] Extension installed:",t.reason),t.reason==="install"&&m.openOptionsPage(),await x()});x();
