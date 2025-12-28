import{s as x,g as m,a as f,b as w,c as d}from"../shared/personas.js";const u=typeof browser<"u",p=u?browser.runtime:chrome.runtime,c=u?browser.contextMenus:chrome.contextMenus,h=u?browser.tabs:chrome.tabs;console.log("[Chameleon] Background script loaded");const y=[{id:"chameleon-explain",title:"💡 Explain this",category:"understand"},{id:"chameleon-explain-simple",title:"🎯 Explain like I'm 5",category:"understand"},{id:"chameleon-define",title:"📖 Define words",category:"understand"},{id:"sep1",type:"separator"},{id:"chameleon-summarize",title:"📝 Summarize",category:"analyze"},{id:"chameleon-key-points",title:"🔑 Extract key points",category:"analyze"},{id:"chameleon-pros-cons",title:"⚖️ List pros & cons",category:"analyze"},{id:"sep2",type:"separator"},{id:"chameleon-improve",title:"✨ Improve writing",category:"writing"},{id:"chameleon-fix-grammar",title:"🔧 Fix grammar & spelling",category:"writing"},{id:"chameleon-formal",title:"👔 Make formal",category:"writing"},{id:"chameleon-casual",title:"😊 Make casual",category:"writing"},{id:"chameleon-shorter",title:"✂️ Make shorter",category:"writing"},{id:"chameleon-longer",title:"📄 Expand / elaborate",category:"writing"},{id:"sep3",type:"separator"},{id:"chameleon-explain-code",title:"💻 Explain code",category:"code"},{id:"chameleon-find-bugs",title:"🐛 Find bugs",category:"code"},{id:"chameleon-optimize",title:"⚡ Optimize code",category:"code"},{id:"sep4",type:"separator"},{id:"chameleon-translate-en",title:"🇬🇧 Translate to English",category:"translate"},{id:"chameleon-translate-de",title:"🇩🇪 Translate to German",category:"translate"},{id:"chameleon-translate-es",title:"🇪🇸 Translate to Spanish",category:"translate"},{id:"chameleon-translate-fr",title:"🇫🇷 Translate to French",category:"translate"},{id:"sep5",type:"separator"},{id:"chameleon-ask",title:"💬 Ask Chameleon...",category:"custom"}];async function E(){await c.removeAll(),c.create({id:"chameleon-main",title:"🦎 Chameleon AI",contexts:["selection"]});for(const t of y)t.type==="separator"?c.create({id:t.id,parentId:"chameleon-main",type:"separator",contexts:["selection"]}):c.create({id:t.id,parentId:"chameleon-main",title:t.title,contexts:["selection"]});console.log("[Chameleon] Context menus initialized with",y.length,"items")}function O(t,e){return{"chameleon-explain":`Explain the following text clearly and concisely:

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

"${e}"`}[t]||`Help me with this:

"${e}"`}c.onClicked.addListener(async(t,e)=>{var g;const o=t.selectionText;if(!o||!(e!=null&&e.id))return;const n=t.menuItemId;if(console.log("[Chameleon] Context menu clicked:",n),n==="chameleon-ask"){await x({...await m()||{},pendingText:o});try{(g=chrome.action)!=null&&g.openPopup&&chrome.action.openPopup()}catch{r(e.id,{type:"SHOW_RESPONSE",response:"Open the Chameleon popup to continue chatting with the selected text.",persona:"Chameleon"})}return}const i=await m();if(!(i!=null&&i.apiKey)){r(e.id,{type:"SHOW_ERROR",error:"Please open the Chameleon extension and log in to your account."}),p.openOptionsPage();return}const a=f(i.selectedPersona)||w(),s=O(n,o);try{r(e.id,{type:"SHOW_LOADING",text:`${a.emoji} ${a.name} is thinking...`});const l=await d(i.apiKey,i.selectedModel||"anthropic/claude-3.5-sonnet",[{role:"user",content:s}],a.personality);r(e.id,{type:"SHOW_RESPONSE",response:l,persona:a.name,personaEmoji:a.emoji,action:n.replace("chameleon-","")})}catch(l){console.error("[Chameleon] Error:",l),r(e.id,{type:"SHOW_ERROR",error:l instanceof Error?l.message:"Something went wrong. Check your API key."})}});function r(t,e){h.sendMessage(t,e).catch(o=>{console.error("[Chameleon] Error sending message to content script:",o)})}p.onMessage.addListener((t,e,o)=>{var n,i;switch(console.log("[Chameleon] Message received:",t.type),t.type){case"GET_SELECTED_TEXT":h.query({active:!0,currentWindow:!0}).then(a=>{var s;(s=a[0])!=null&&s.id&&r(a[0].id,{type:"GET_SELECTION"})});break;case"OPEN_SIDEPANEL":chrome.sidePanel&&chrome.sidePanel.open({windowId:(n=e.tab)==null?void 0:n.windowId});break;case"CHECK_AUTH":return m().then(a=>{o({authenticated:!!(a!=null&&a.apiKey)})}),!0;case"SUMMARIZE_PAGE":h.query({active:!0,currentWindow:!0}).then(a=>{var s;(s=a[0])!=null&&s.id&&S(a[0].id)});break;case"WRITING_ASSIST":R(t.action,t.text,(i=e.tab)==null?void 0:i.id);break;default:console.warn("[Chameleon] Unknown message type:",t.type)}return!1});async function S(t){if(!t)return;const e=await m();if(!(e!=null&&e.apiKey)){r(t,{type:"SHOW_ERROR",error:"Please sign in to use this feature."});return}const o=f(e.selectedPersona)||w();r(t,{type:"SHOW_LOADING",text:`${o.emoji} Reading page content...`});try{const n=await h.sendMessage(t,{type:"GET_PAGE_CONTENT"});if(!n||!n.textContent){r(t,{type:"SHOW_ERROR",error:"Could not extract page content."});return}r(t,{type:"SHOW_LOADING",text:`${o.emoji} Summarizing "${n.title}"...`});const i=await d(e.apiKey,e.selectedModel||"anthropic/claude-3.5-sonnet",[{role:"user",content:`Please summarize the following article in a clear, concise way. Include the key points and main takeaways.

Title: ${n.title}

Content:
${n.textContent}`}],o.personality);r(t,{type:"SHOW_RESPONSE",response:i,persona:o.name,personaEmoji:o.emoji,action:"summarize"})}catch(n){console.error("[Chameleon] Summarize error:",n),r(t,{type:"SHOW_ERROR",error:n instanceof Error?n.message:"Failed to summarize page."})}}async function R(t,e,o){if(!o||!e)return;const n=await m();if(!(n!=null&&n.apiKey)){r(o,{type:"SHOW_ERROR",error:"Please sign in to use this feature."});return}const i={improve:`Improve the following text. Make it clearer, more engaging, and well-written. Return ONLY the improved text, no explanations:

${e}`,fix:`Fix any grammar, spelling, and punctuation errors in the following text. Return ONLY the corrected text, no explanations:

${e}`,shorter:`Make the following text shorter and more concise while keeping the main message. Return ONLY the shortened text, no explanations:

${e}`,formal:`Rewrite the following text in a more formal, professional tone. Return ONLY the formal version, no explanations:

${e}`,casual:`Rewrite the following text in a more casual, friendly tone. Return ONLY the casual version, no explanations:

${e}`},a=i[t]||i.improve;r(o,{type:"SHOW_LOADING",text:"Improving your text..."});try{const s=await d(n.apiKey,n.selectedModel||"anthropic/claude-3.5-sonnet",[{role:"user",content:a}],"You are a helpful writing assistant. Be concise and direct.");r(o,{type:"APPLY_WRITING_RESULT",text:s}),r(o,{type:"SHOW_RESPONSE",response:`Text ${t==="fix"?"corrected":t==="improve"?"improved":t==="shorter"?"shortened":`made ${t}`}!

${s}`,persona:"Writing Assistant",personaEmoji:"✍️"})}catch(s){console.error("[Chameleon] Writing assist error:",s),r(o,{type:"SHOW_ERROR",error:s instanceof Error?s.message:"Failed to process text."})}}p.onInstalled.addListener(async t=>{console.log("[Chameleon] Extension installed:",t.reason),t.reason==="install"&&p.openOptionsPage(),await E()});E();
