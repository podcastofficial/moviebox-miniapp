// ---- Telegram Mini App bootstrap ----
const tg=window.Telegram?.WebApp;
const inTelegram=!!(tg&&tg.initData);
const apiHeaders=()=>inTelegram?{"X-Telegram-Init-Data":tg.initData}:{};
if(tg){
  try{
    tg.ready();tg.expand();
    if(tg.disableVerticalSwipes)tg.disableVerticalSwipes();
    const applyTheme=()=>{const t=tg.themeParams||{};const r=document.documentElement.style;
      if(t.bg_color&&!document.body.dataset.keepDark){/* keep cinematic dark theme; only set chrome colors */}
      try{tg.setHeaderColor("#090b12");tg.setBackgroundColor("#090b12")}catch{}};
    applyTheme();tg.onEvent("themeChanged",applyTheme);
    document.documentElement.classList.add("tg");
  }catch{}
}
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const store={get(k,d=[]){try{return JSON.parse(localStorage.getItem("mb_"+k))??d}catch{return d}},set(k,v){localStorage.setItem("mb_"+k,JSON.stringify(v))}};
let favorites=store.get("favorites"),history=store.get("history"),streams=store.get("streams"),downloads=store.get("downloads"),libraryTab="favorites";
let activeDownload=null;
const toast=m=>{const t=$("#toast");t.textContent=m;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2400)};
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const posterPath=p=>p?`https://image.tmdb.org/t/p/w500${p}`:"";
const titleOf=x=>x.title||x.name||x.label||"Untitled";
function card(item,kind="discover"){
 const id=item.id??item.url??item.title, title=titleOf(item), image=item.poster_path?posterPath(item.poster_path):item.poster||"";
 const saved=favorites.some(x=>String(x.id??x.url??x.title)===String(id));
 const year=(item.release_date||item.first_air_date||"").slice(0,4);
 return `<article class="media-card"><div class="cover">${image?`<img loading="lazy" src="${esc(image)}" alt="${esc(title)}" onerror="this.remove()">`:`<div class="cover-placeholder">✦</div>`}</div><h3 title="${esc(title)}">${esc(title)}</h3><div class="meta">${esc(item.media_type||item.type||"Title")} ${year?"· "+year:""} ${item.vote_average?"· ★ "+Number(item.vote_average).toFixed(1):""}</div><div class="card-actions"><button class="mini-btn" data-play="${esc(id)}" data-title="${esc(title)}" data-url="${esc(item.url||"")}">▶ Play</button><button class="mini-btn" data-fav="${esc(id)}" data-kind="${kind}">${saved?"♥":"♡"}</button><button class="mini-btn" data-detail="${esc(id)}" data-kind="${kind}">Info</button></div></article>`;
}
function renderContinue(){const el=$("#continueGrid");el.innerHTML=history.length?history.slice(0,4).map(x=>card(x,"history")).join(""):`<div class="empty">Your progress will appear here after you play a video.</div>`}
function renderLibrary(){let data=libraryTab==="favorites"?favorites:libraryTab==="history"?history:streams;$("#libraryGrid").innerHTML=data.length?data.map(x=>card(x,libraryTab)).join(""):`<div class="empty">Nothing here yet. Add a stream or save a title to get started.</div>`}
async function search(){const q=$("#searchInput").value.trim();if(!q)return toast("Enter a title to search.");$("#results").innerHTML='<div class="empty">Searching…</div>';try{const r=await fetch(`/api/search?q=${encodeURIComponent(q)}&type=${$("#searchType").value}`,{headers:apiHeaders()});const d=await r.json();if(!r.ok)throw Error(d.error);$("#results").innerHTML=d.results.length?d.results.map(x=>card(x,"discover")).join(""):`<div class="empty">No results found.</div>`}catch(e){$("#results").innerHTML=`<div class="empty">${esc(e.message)}<br><br>Set TMDB_API_KEY in your server .env file and restart.</div>`}}
function openModal(id){$("#"+id).classList.remove("hidden")}function closeModal(id){$("#"+id).classList.add("hidden")}
function play(title,url,item){if(!url){openModal("addModal");$("#streamTitle").value=title;toast("Add an authorized playback URL to play this title.");return}$("#playerTitle").textContent=title;const v=$("#videoPlayer");v.pause();v.src=url;v.load();openModal("playerModal");v.play().catch(()=>{});const entry={...(item||{}),title,url,watchedAt:Date.now()};history=[entry,...history.filter(x=>x.url!==url)].slice(0,100);store.set("history",history);renderContinue();renderLibrary()}
function toggleFav(id,kind){const source=kind==="streams"?streams:kind==="history"?history:[];let item=source.find(x=>String(x.id??x.url??x.title)===String(id));if(!item){item={id,title:document.querySelector(`[data-fav="${CSS.escape(id)}"]`)?.closest(".media-card")?.querySelector("h3")?.textContent||"Saved title"}}
 const exists=favorites.some(x=>String(x.id??x.url??x.title)===String(id));favorites=exists?favorites.filter(x=>String(x.id??x.url??x.title)!==String(id)):[item,...favorites];store.set("favorites",favorites);renderContinue();renderLibrary();if(!$("#homeView").classList.contains("hidden")&&$("#searchInput").value.trim())search();toast(exists?"Removed from favorites":"Added to favorites")}
document.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;if(b.dataset.view){$$(".view").forEach(x=>x.classList.add("hidden"));$("#"+b.dataset.view+"View").classList.remove("hidden");$$(".nav-link").forEach(x=>x.classList.toggle("active",x===b));if(b.dataset.view==="library")renderLibrary();if(b.dataset.view==="downloads")renderDownloads()}
if(b.dataset.close)closeModal(b.dataset.close);if(b.id==="browseBtn")$("#searchInput").focus();if(b.id==="addMediaBtn")openModal("addModal");if(b.id==="settingsBtn")openModal("settingsModal");if(b.dataset.library){libraryTab=b.dataset.library;$$(".tab").forEach(x=>x.classList.toggle("active",x===b));renderLibrary()}
if(b.dataset.play){let item=[...favorites,...history,...streams].find(x=>String(x.id??x.url??x.title)===b.dataset.play);play(b.dataset.title,b.dataset.url||item?.url,item)}
if(b.dataset.fav)toggleFav(b.dataset.fav,b.dataset.kind);if(b.dataset.detail)toast("Metadata details: use the title and rating shown above.")}
);
$("#searchBtn").onclick=search;$("#searchInput").addEventListener("keydown",e=>{if(e.key==="Enter")search()});
$("#addForm").onsubmit=e=>{e.preventDefault();const item={id:"s"+Date.now(),title:$("#streamTitle").value.trim(),url:$("#streamUrl").value.trim(),type:$("#streamType").value};streams=[item,...streams];store.set("streams",streams);e.target.reset();closeModal("addModal");renderLibrary();toast("Stream saved to My Library.")};
$("#speed").onchange=()=>$("#videoPlayer").playbackRate=Number($("#speed").value);
$("#subtitleFile").onchange=e=>{const f=e.target.files[0];if(!f)return;const url=URL.createObjectURL(f),v=$("#videoPlayer");v.querySelectorAll("track").forEach(t=>t.remove());const track=document.createElement("track");track.kind="subtitles";track.label=f.name;track.srclang="en";track.src=url;track.default=true;v.append(track);toast("Subtitle track added. SRT support varies; WebVTT (.vtt) is recommended.")};
$("#saveSettings").onclick=()=>{const key=$("#tmdbKey").value.trim();localStorage.setItem("mb_tmdb_key",key);toast("Saved in this browser. Server-side key is recommended.");closeModal("settingsModal")};
$("#loadPlaylist").onclick=async()=>{const raw=$("#playlistInput").value.trim();if(!raw)return toast("Paste playlist content or URL.");let text=raw;if(/^https?:\/\//i.test(raw)){try{const r=await fetch(raw);if(!r.ok)throw Error();text=await r.text()}catch{return toast("Playlist could not be fetched (CORS or network restriction). Paste M3U text instead.")}}
 const lines=text.split(/\r?\n/);let current="";const list=[];for(const line of lines){if(line.startsWith("#EXTINF")){current=line.split(",").slice(1).join(",").trim()||"Channel"}else if(line.trim()&&!line.startsWith("#")&&/^https?:\/\//i.test(line.trim())){list.push({title:current||"Channel",url:line.trim(),type:"Live TV",id:"iptv"+list.length});current=""}}
 $("#channels").innerHTML=list.length?list.map((x,i)=>`<div class="channel"><span>${esc(x.title)}</span><button class="mini-btn" data-play="${esc(x.id)}" data-title="${esc(x.title)}" data-url="${esc(x.url)}">▶ Watch</button></div>`).join(""):'<div class="empty">No valid HTTP(S) channel URLs found.</div>';streams=[...list,...streams];store.set("streams",streams);toast(`${list.length} channels loaded.`)};
$("#tmdbKey").value=localStorage.getItem("mb_tmdb_key")||"";
renderContinue();renderLibrary();
if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("/sw.js").catch(()=>{}));


function renderDownloads(){
 const el=$("#downloadGrid"); if(!el)return;
 el.innerHTML=downloads.length?downloads.map((x,i)=>`<div class="download-row"><div><strong>${esc(x.title)}</strong><small>${esc(x.status||"Saved")} · ${esc(x.date||"")}</small></div><div class="card-actions"><button class="mini-btn" data-redownload="${i}">Download again</button><button class="mini-btn" data-remove-download="${i}">Remove</button></div></div>`).join(""):'<div class="empty">No downloads yet. Add a direct, authorized media URL above.</div>';
}
function saveDownloadRecord(item){
 downloads=[item,...downloads].slice(0,100);store.set("downloads",downloads);renderDownloads();
}
async function startDownload(){
 const title=$("#downloadTitle").value.trim()||"MovieBox media";
 const url=$("#downloadUrl").value.trim();
 if(!/^https?:\/\//i.test(url))return toast("Enter a valid direct HTTP(S) media URL.");
 if(activeDownload)return toast("A download is already running.");
 if(inTelegram){
   // Telegram WebView can't save blob: downloads, so hand the direct URL to Telegram / external browser.
   const fname=(title.replace(/[\\/:*?"<>|]/g,"_")+(/\.[a-z0-9]{2,4}($|\?)/i.test(url)?"":".mp4"));
   try{
     if(tg.isVersionAtLeast&&tg.isVersionAtLeast("8.0")&&tg.downloadFile){
       tg.downloadFile({url,file_name:fname},ok=>{if(ok)saveDownloadRecord({title,url,status:"Download requested",date:new Date().toLocaleString()})});
     }else{tg.openLink(url);saveDownloadRecord({title,url,status:"Opened in browser",date:new Date().toLocaleString()})}
     $("#downloadStatus").textContent="Download handed to Telegram. Check your device Downloads.";
   }catch{tg.openLink(url)}
   return;
 }
 const controller=new AbortController();activeDownload={controller,title,url};
 const status=$("#downloadStatus");status.innerHTML=`Preparing ${esc(title)}…`;
 try{
   const response=await fetch(url,{signal:controller.signal});
   if(!response.ok)throw Error(`Server returned ${response.status}.`);
   if(!response.body)throw Error("This browser cannot track this download. Try opening the direct URL in your browser.");
   const total=Number(response.headers.get("content-length"))||0;
   const reader=response.body.getReader();const chunks=[];let received=0;
   while(true){
     const {done,value}=await reader.read();if(done)break;
     chunks.push(value);received+=value.length;
     const pct=total?Math.min(100,Math.round(received/total*100)):0;
     status.innerHTML=`Downloading ${esc(title)} · ${total?pct+"%":(received/1048576).toFixed(1)+" MB"}<div class="progress"><span style="width:${pct}%"></span></div>`;
   }
   const blob=new Blob(chunks,{type:response.headers.get("content-type")||"application/octet-stream"});
   const objectUrl=URL.createObjectURL(blob);const a=document.createElement("a");
   const disposition=response.headers.get("content-disposition")||"";
   const match=disposition.match(/filename\\*?=(?:UTF-8''|")?([^";]+)/i);
   const filename=(match?decodeURIComponent(match[1].replace(/"/g,"")):title).replace(/[\\\\/:*?"<>|]/g,"_");
   a.href=objectUrl;a.download=filename.includes(".")?filename:filename+".mp4";document.body.append(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(objectUrl),60000);
   saveDownloadRecord({title,url,status:"Download requested",date:new Date().toLocaleString()});
   status.textContent="Download sent to your browser. Check your Downloads folder.";
   toast("Download started in your browser.");
 }catch(e){
   status.textContent=e.name==="AbortError"?"Download cancelled":`${e.message} If this is a CORS-restricted source, open its direct download link in your browser instead.`;
   toast(e.name==="AbortError"?"Download cancelled":"Download could not be completed.");
 }finally{activeDownload=null}
}
$("#startDownload").onclick=startDownload;
$("#clearDownloads").onclick=()=>{downloads=[];store.set("downloads",downloads);renderDownloads();};
document.addEventListener("click",e=>{
 const b=e.target.closest("button");if(!b)return;
 if(b.dataset.redownload!==undefined){const item=downloads[Number(b.dataset.redownload)];if(item){$("#downloadTitle").value=item.title;$("#downloadUrl").value=item.url;startDownload()}}
 if(b.dataset.removeDownload!==undefined){downloads.splice(Number(b.dataset.removeDownload),1);store.set("downloads",downloads);renderDownloads()}
});
renderDownloads();


// ---- Telegram BackButton: close modals first, then go back to Home ----
if(tg&&tg.BackButton){
  const modals=["playerModal","addModal","settingsModal"];
  const openModalId=()=>modals.find(id=>!$("#"+id).classList.contains("hidden"));
  const homeActive=()=>!$("#homeView").classList.contains("hidden");
  const syncBack=()=>{(openModalId()||!homeActive())?tg.BackButton.show():tg.BackButton.hide()};
  tg.BackButton.onClick(()=>{
    const m=openModalId();
    if(m){if(m==="playerModal")$("#videoPlayer").pause();closeModal(m)}
    else if(!homeActive()){$('.nav-link[data-view="home"]').click()}
    syncBack();
  });
  new MutationObserver(syncBack).observe(document.body,{subtree:true,attributes:true,attributeFilter:["class"]});
  syncBack();
}
