const KEY='BS_V20_DEMO';
let sb=null, S=null, current='dashboard', tm=null, secs=600, mode='AMRAP', signupMode=false, selectedRole='client';

const coachNav=[['dashboard','⌂','Accueil'],['clients','♙','Clients'],['programmes','☷','Programmes'],['calendar','▣','Planning'],['timer','⏱','Timer'],['live','▶','Séance live'],['media','🎥','Vidéos'],['notifications','🔔','Notifications'],['progress','↗','Progression'],['nutrition','🥗','Nutrition'],['ai','✦','Coach IA'],['payments','€','Paiements'],['settings','⚙','Réglages']];
const clientNav=[['dashboard','⌂','Accueil'],['programme','☷','Programme'],['calendar','▣','Planning'],['timer','⏱','Timer'],['live','▶','Séance live'],['media','🎥','Vidéos'],['notifications','🔔','Notifications'],['progress','↗','Progression'],['nutrition','🥗','Nutrition'],['ai','✦','Coach IA'],['profil','♙','Profil']];
const titles={dashboard:['Dashboard','Ton cockpit performance'],clients:['Mes clients','Suivi individuel'],programmes:['Programmes','Création multi-semaines'],programme:['Mon programme','Ta progression semaine après semaine'],calendar:['Planning','Séances et disponibilité'],timer:['Timer WOD','AMRAP • EMOM • FOR TIME • TABATA'],progress:['Progression','Performances et évolution'],nutrition:['Nutrition','Objectifs et idées repas'],ai:['Coach IA','Assistant intelligent'],payments:['Paiements','Coaching inclus & Premium'],settings:['Réglages','Compte et préférences'],profil:['Mon profil','Tes informations']};

function localDemo(){return {user:{id:'demo',name:'Jonathan',email:'demo@bestronger.app',role:'coach',access:'coach'},clients:[
{name:'Thomas D.',email:'thomas@example.com',goal:'Perte de gras',access:'coaching',progress:78,streak:6},
{name:'Inès M.',email:'ines@example.com',goal:'Hypertrophie',access:'coaching',progress:64,streak:4},
{name:'Lucas R.',email:'lucas@example.com',goal:'CrossFit / HYROX',access:'premium',progress:41,streak:2}],sessions:48,volume:124350,streak:7,weight:82};}
function demoLogin(){S=localDemo();document.getElementById('authGate').classList.add('hidden');boot();startRealtime()}
function initSupabase(){if(window.BS_CONFIG?.SUPABASE_URL && window.BS_CONFIG?.SUPABASE_ANON_KEY && window.supabase){sb=window.supabase.createClient(BS_CONFIG.SUPABASE_URL,BS_CONFIG.SUPABASE_ANON_KEY);return true}return false}
async function start(){if(initSupabase()){const {data}=await sb.auth.getSession();if(data.session){await loadRemote(data.session.user)}else showAuth()}else{S=JSON.parse(localStorage.getItem(KEY)||'null');S?hideAuth():showAuth()}}
function hideAuth(){document.getElementById('authGate').classList.add('hidden');boot()}
function showAuth(){document.getElementById('authGate').classList.remove('hidden')}
function authMode(signup){signupMode=signup==='signup';document.getElementById('authTitle').textContent=signupMode?'Créer ton espace.':'Bienvenue.';document.getElementById('authText').textContent=signupMode?'Crée ton compte sportif ou coach.':'Connecte-toi à ton espace BE STRONGER.';document.getElementById('authName').classList.toggle('hidden',!signupMode);document.getElementById('authCode').classList.toggle('hidden',!signupMode);document.getElementById('authRole').classList.toggle('hidden',!signupMode);document.getElementById('accessChoice').classList.toggle('hidden',!signupMode);document.getElementById('authSubmit').textContent=signupMode?'CRÉER MON COMPTE':'SE CONNECTER';document.getElementById('tabLogin').classList.toggle('on',!signupMode);document.getElementById('tabSignup').classList.toggle('on',signupMode)}
function setRole(r){selectedRole=r;document.querySelectorAll('#authRole button').forEach((b,i)=>b.classList.toggle('on',(r==='client'&&i===0)||(r==='coach'&&i===1)))}
async function submitAuth(){
 const email=document.getElementById('authEmail').value.trim(),password=document.getElementById('authPassword').value,
 name=document.getElementById('authName').value.trim()||'Athlète',code=document.getElementById('authCode').value.trim().toUpperCase();
 if(!email||password.length<6)return authMsg('Email valide et mot de passe de 6 caractères minimum.');
 if(!sb)return authMsg('Supabase n’est pas configuré. Utilise la démo ou renseigne config.js.');
 if(!signupMode){
   const {data,error}=await sb.auth.signInWithPassword({email,password});
   if(error)return authMsg(error.message);
   await loadRemote(data.user); return;
 }
 if(selectedRole==='client' && selectedAccess==='coaching' && !code)return authMsg('Entre le code de ton coach pour recevoir l’accès inclus.');
 const {data,error}=await sb.auth.signUp({email,password,options:{data:{name,role:selectedRole,invite_code:code,requested_access:selectedAccess}}});
 if(error)return authMsg(error.message);
 if(data.user){
   if(selectedRole==='client' && selectedAccess==='coaching'){
     const result=await acceptInvite(code,data.user.id);
     if(!result.ok)return authMsg(result.message);
   }
   await loadRemote(data.user);
   toast('Compte créé');
 }
}
async function acceptInvite(code,userId){
 if(!sb)return {ok:false,message:'Connexion serveur indisponible.'};
 const {data,error}=await sb.rpc('accept_coach_invite',{p_code:code,p_client_id:userId});
 if(error)return {ok:false,message:error.message};
 if(!data?.ok)return {ok:false,message:data?.message||'Code invalide ou expiré.'};
 return {ok:true};
}

function authMsg(x){document.getElementById('authMsg').textContent=x}
async function loadRemote(user){
 let profile=null;
 const {data,error}=await sb.from('profiles').select('*').eq('id',user.id).single();
 if(error||!data){
   S={user:{id:user.id,name:user.user_metadata?.name||'Athlète',email:user.email,role:user.user_metadata?.role||'client',access:user.user_metadata?.requested_access||'premium'},clients:[],sessions:0,volume:0,streak:0,weight:0};
 }else{
   S={user:{id:user.id,name:data.name,email:user.email,role:data.role,access:data.access},clients:[],sessions:0,volume:0,streak:0,weight:data.weight||0};
 }
 if(S.user.role==='coach'){
   const {data:cs}=await sb.from('coach_clients').select('client_id,profiles!coach_clients_client_id_fkey(id,name,email,access)').eq('coach_id',user.id);
   S.clients=(cs||[]).map(x=>({name:x.profiles?.name,email:x.profiles?.email,access:x.profiles?.access||'coaching',progress:0,streak:0,goal:''}));
 }
 hideAuth();boot();startRealtime()
}



function media(){
  const q=(document.getElementById('mediaSearch')?.value||'').toLowerCase();
  const items=mediaLibrary.filter(x=>(x.name||'').toLowerCase().includes(q)||(x.category||'').toLowerCase().includes(q));
  return `<div class="hero"><h1>Bibliothèque <span class="red">vidéo.</span></h1><p class="muted">Démonstrations techniques accessibles directement pendant les programmes.</p>
  <div class="mediaToolbar"><input id="mediaSearch" placeholder="Rechercher un exercice…" value="${q}" oninput="page('media')"><button class="primary" onclick="addMedia()">+ AJOUTER UNE VIDÉO</button></div></div>
  <div class="mediaGrid">${items.map(v=>`<article class="mediaCard">
    <div class="mediaThumb">${v.url?`<video controls preload="metadata" src="${v.url}"></video>`:'🎬'}</div>
    <div class="mediaBody"><b>${v.name}</b><span class="muted">${v.category||'Technique'} ${v.duration?`• ${v.duration}`:''}</span><p>${v.description||''}</p>
    <div class="actions"><button class="secondary" onclick="attachMedia('${v.id}')">LIER À UN EXERCICE</button><button class="danger" onclick="removeMedia('${v.id}')">SUPPRIMER</button></div></div>
  </article>`).join('') || `<div class="card"><p class="muted">Aucune vidéo. Ajoute ta première démonstration.</p></div>`}</div>`;
}
function addMedia(){
 const name=prompt('Nom de l’exercice'); if(!name)return;
 const url=prompt('URL vidéo publique ou Supabase Storage'); if(!url)return;
 const category=prompt('Catégorie','Technique')||'Technique';
 mediaLibrary.unshift({id:'m_'+Date.now(),name,url,category,description:'Démonstration coach'});
 save(); page('media');
}
function removeMedia(id){mediaLibrary=mediaLibrary.filter(x=>x.id!==id);save();page('media')}
function attachMedia(id){
 const v=mediaLibrary.find(x=>x.id===id); if(!v)return;
 const ex=prompt(`À quel exercice lier "${v.name}" ?`);
 if(!ex)return;
 toast(`🎥 Vidéo liée à ${ex}`);
 if(sb)sb.from('exercise_media').insert({exercise_name:ex,title:v.name,video_url:v.url,description:v.description});
}
function startRealtime(){
  if(!S)return;
  if(sb){
    if(realtimeChannel)sb.removeChannel(realtimeChannel);
    realtimeChannel=sb.channel('bs-live')
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'workout_live_events'},payload=>{
        const e=payload.new||{}; clientFeed.unshift(e); unreadCount++; renderBell(); toast(`🔴 ${e.client_name||'Client'} : ${e.event_type||'activité'}`);
        if(current==='notifications')page('notifications');
      })
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'notifications',filter:`user_id=eq.${S.user.id}`},payload=>{
        unreadCount++; renderBell(); toast('🔔 Nouvelle notification');
        if(current==='notifications')page('notifications');
      }).subscribe();
  }
}
function renderBell(){const b=document.querySelector('[data-bell]');if(b)b.textContent=unreadCount?`🔔 ${unreadCount}`:'🔔'}
async function markNotificationsRead(){
 if(sb)await sb.from('notifications').update({read_at:new Date().toISOString()}).eq('user_id',S.user.id).is('read_at',null);
 unreadCount=0;renderBell();page('notifications')
}
function notifications(){
 return `<div class="hero"><h1>Activité <span class="red">live.</span></h1><p class="muted">Les validations de tes clients peuvent apparaître ici en temps réel.</p>
 <div class="actions"><button class="secondary" onclick="markNotificationsRead()">TOUT MARQUER COMME LU</button></div></div>
 <div class="list">${clientFeed.length?clientFeed.map(e=>`<div class="row"><span><b>${e.client_name||'Client'}</b><br><small class="muted">${e.event_type||'Activité'} • ${e.exercise_name||''}</small></span><span class="badge">${e.created_at?new Date(e.created_at).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}):'maintenant'}</span></div>`).join(''):'<div class="card"><p class="muted">Aucune activité live pour le moment.</p></div>'}</div>`;
}
function save(){localStorage.setItem(KEY,JSON.stringify(S))}
function boot(){if(!mediaLibrary.length) mediaLibrary=[
{id:'demo1',name:'Squat barre',category:'Jambes',url:'',description:'Placement, amplitude et respiration.'},
{id:'demo2',name:'Développé couché',category:'Pectoraux',url:'',description:'Omoplates, trajectoire et contrôle.'},
{id:'demo3',name:'Rowing barre',category:'Dos',url:'',description:'Gainage et tirage contrôlé.'}
];if(!document.querySelector('[data-bell]')){const h=document.querySelector('.headRight');if(h){const b=document.createElement('button');b.className='secondary bell';b.dataset.bell='1';b.onclick=()=>page('notifications');b.textContent='🔔';h.insertBefore(b,h.firstChild)}}document.getElementById('topAccess').textContent=S.user.role==='coach'?'ESPACE COACH':S.user.access==='coaching'?'COACHING INCLUS':'PREMIUM';document.getElementById('access').textContent=document.getElementById('topAccess').textContent;nav();page(current)}
function nav(){const a=S.user.role==='coach'?coachNav:clientNav;document.getElementById('nav').innerHTML=a.map(n=>`<button class="${current===n[0]?'active':''}" onclick="page('${n[0]}')"><span>${n[1]}</span>${n[2]}</button>`).join('')}
function page(p){current=p;nav();document.querySelector('.side').classList.remove('open');document.getElementById('title').textContent=titles[p]?.[0]||'BE STRONGER';document.getElementById('subtitle').textContent=titles[p]?.[1]||'';const f={dashboard,clients,programmes,programme,calendar,timer,progress,nutrition,ai,payments,settings,profil};document.getElementById('content').innerHTML=`<div class="wrap">${(f[p]||dashboard)()}</div>`;if(p==='timer'){secs=mode==='TABATA'?20:mode==='FOR TIME'?0:600;clock()}}
function stat(i,n,l){return `<div class="card stat"><span>${i}</span><b>${n}</b><small>${l}</small></div>`}
function dashboard(){if(S.user.role==='coach')return `<div class="hero"><p class="muted">Bonjour ${S.user.name} 👋</p><h1>Ton cockpit <span class="red">coach.</span></h1><p class="muted">V20 ajoute l’authentification réelle et une base de données prête à sécuriser les comptes.</p></div><div class="grid">${stat('♙',S.clients.length,'Clients')} ${stat('⏱',S.sessions,'Séances')} ${stat('⚖',S.volume+' kg','Volume')} ${stat('🔥',S.streak+' j','Série')}</div><div class="section card"><div class="sectionHead"><h2>Centre de suivi</h2><span class="badge">LIVE</span></div><div class="grid3"><div><b>2</b><p class="muted">séances à valider</p></div><div><b>1</b><p class="muted">client à relancer</p></div><div><b>3</b><p class="muted">records récents</p></div></div></div><div class="section grid3"><button class="card" onclick="page('clients')">👥<h3>Clients</h3><small class="muted">Accès isolés</small></button><button class="card" onclick="page('programmes')">🏋️<h3>Programmes</h3><small class="muted">Multi-semaines</small></button><button class="card" onclick="page('timer')">⏱<h3>Timer</h3><small class="muted">4 formats</small></button><button class="card" onclick="page('live')">▶<h3>Séance live</h3><small class="muted">Guidage & validation</small></button></div>`;
return `<div class="hero"><p class="muted">Bonjour ${S.user.name} 👋</p><h1>Prêt à <span class="red">progresser ?</span></h1><p class="muted">Ton espace privé. Ton programme. Tes données.</p></div><div class="grid">${stat('🏋',S.sessions,'Séances')} ${stat('⚖',S.weight+' kg','Poids')} ${stat('🔥',S.streak+' j','Série')} ${stat('↗','+12%','Progression')}</div><div class="card section"><h3>Prochaine séance</h3><p class="muted">Haut du corps • 5 exercices • 45 min</p><button class="primary" onclick="page('programme')">COMMENCER</button></div>`}
function clients(){if(S.user.role!=='coach')return `<div class="hero"><h1>Mon espace <span class="red">privé.</span></h1><p class="muted">Tu n'as accès qu'à tes propres données.</p></div>`;return `<div class="hero"><h1>Mes <span class="red">clients.</span></h1><p class="muted">La V20 prépare la séparation serveur coach/client.</p><button class="primary" onclick="invite()">+ INVITER UN CLIENT</button></div><div class="card"><table class="table"><thead><tr><th>Client</th><th>Accès</th><th>Progression</th><th></th></tr></thead><tbody>${S.clients.map((c,i)=>`<tr><td><b>${c.name}</b><br><small>${c.email}</small></td><td><span class="badge">${c.access==='coaching'?'Coaching inclus':'Premium'}</span></td><td>${c.progress||0}%</td><td><button class="secondary" onclick="client(${i})">OUVRIR</button></td></tr>`).join('')}</tbody></table></div>`}
function invite(){modal(`<h2>Invitation client</h2><p class="muted">En production, ce code sera enregistré côté serveur et associé à ton compte coach.</p><div class="card" style="text-align:center;font-size:26px;font-weight:900" id="code">BS-XXXXXX</div><button class="primary" onclick="genCode()">GÉNÉRER</button>`)}
function genCode(){document.getElementById('code').textContent='BS-'+Math.random().toString(36).slice(2,8).toUpperCase();toast('Code généré')}
function client(i){const c=S.clients[i];modal(`<h2>${c.name}</h2><p>${c.email}</p><div class="grid2">${stat('✓',(c.progress||0)+'%','Progression')}${stat('🔥',(c.streak||0)+' j','Régularité')}</div><button class="primary" onclick="closeModal();page('programmes')">PROGRAMME</button>`)}
function programmes(){return `<div class="hero"><h1>Mes <span class="red">programmes.</span></h1><p class="muted">Programmes multi-semaines avec séries, reps, repos et charges.</p>${S.user.role==='coach'?'<button class="primary" onclick="programModal()">+ NOUVEAU PROGRAMME</button>':''}</div><div class="grid3">${['Transformation 8 semaines','Force & Hypertrophie','HYROX Performance'].map((n,i)=>`<div class="card"><span class="badge">ACTIF</span><h3>${n}</h3><p class="muted">8 semaines • 4 séances/semaine</p><div class="progress"><i style="width:${45+i*20}%"></i></div></div>`).join('')}</div>`}
function programModal(){modal(`<h2>Nouveau programme</h2><div class="form"><input class="input" placeholder="Nom"><input class="input" placeholder="Nombre de semaines"><input class="input" placeholder="Séances / semaine"><textarea class="input full" rows="4" placeholder="Objectif / consignes"></textarea></div><button class="primary" onclick="closeModal();toast('Programme enregistré dans le prototype')">ENREGISTRER</button>`)}
function programme(){return `<div class="hero"><h1>Mon <span class="red">programme.</span></h1><p class="muted">Semaine 3 / 8 • ${S.user.access==='coaching'?'Coaching inclus':'Premium'}</p></div>${['Lundi — Haut du corps','Mercredi — Jambes','Vendredi — WOD'].map(d=>`<div class="card" style="margin:9px 0"><h3>${d}</h3>${['Développé couché','Rowing barre','Élévations latérales','Gainage'].map((e,i)=>`<div class="row"><span><b>${e}</b><br><small class="muted">${i<3?'4 × '+(8+i*2):'3 × 1 min'} • repos ${90-i*15}s</small></span><input class="mini" style="width:70px" placeholder="kg" onchange="record(this.value)"></div>`).join('')}<button class="primary" onclick="toast('Séance validée')">VALIDER</button></div>`).join('')}`}
function record(v){const n=parseFloat(v);if(!isNaN(n)){S.volume=(S.volume||0)+n;S.sessions=(S.sessions||0)+1;save();toast('Charge enregistrée')}}
function calendar(){return `<div class="hero"><h1>Mon <span class="red">planning.</span></h1></div><div class="calendar">${['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map((d,i)=>`<div class="day ${i===0?'active':''}"><b>${d}</b><p>${i===0?'🏋️ Haut':i===2?'🦵 Jambes':i===4?'🔥 WOD':'Repos'}</p></div>`).join('')}</div>`}
function timer(){return `<div class="hero"><h1>Timer <span class="red">WOD.</span></h1><p class="muted">AMRAP • EMOM • FOR TIME • TABATA</p></div><div class="card"><div class="modes">${['AMRAP','EMOM','FOR TIME','TABATA'].map(x=>`<button class="${mode===x?'on':''}" onclick="setMode('${x}')">${x}</button>`).join('')}</div><div class="timer" id="clock">10:00</div><div class="actions"><button class="primary" onclick="startTimer()">START</button><button class="secondary" onclick="pauseTimer()">PAUSE</button><button class="secondary" onclick="resetTimer()">RESET</button></div></div>`}
function clock(){const e=document.getElementById('clock');if(e)e.textContent=mode==='FOR TIME'?'00:00':String(Math.floor(secs/60)).padStart(2,'0')+':'+String(secs%60).padStart(2,'0')}
function setMode(m){mode=m;page('timer')}function startTimer(){clearInterval(tm);if(mode==='FOR TIME'){secs=0;tm=setInterval(()=>{secs++;clock()},1000)}else tm=setInterval(()=>{secs--;clock();if(secs<=0){clearInterval(tm);toast('Temps terminé')}},1000)}function pauseTimer(){clearInterval(tm)}function resetTimer(){clearInterval(tm);secs=mode==='TABATA'?20:mode==='FOR TIME'?0:600;clock()}
function progress(){return `<div class="hero"><h1>Ma <span class="red">progression.</span></h1><p class="muted">V20 analyse maintenant le volume, la régularité, les charges et les tendances.</p></div><div class="grid">${stat('⚖',S.weight+' kg','Poids')} ${stat('🏋',S.volume+' kg','Volume')} ${stat('🔥',S.streak+' j','Série')} ${stat('↗','+12%','Évolution')}</div><div class="card section"><h3>Volume sur 8 semaines</h3><div class="chart">${[30,42,50,57,62,73,81,92].map(x=>`<i class="bar" style="height:${x}%"></i>`).join('')}</div></div>`}
function nutrition(){return `<div class="hero"><h1>Nutrition <span class="red">simple.</span></h1><p class="muted">Informations générales, pas de diagnostic médical.</p></div><div class="grid3">${stat('🔥','2 450','kcal cible')} ${stat('🥩','190 g','protéines')} ${stat('💧','2,5 L','eau')}</div>`}
function ai(){return `<div class="hero"><h1>Coach <span class="red">IA.</span></h1><p class="muted">Interface prête à connecter à un moteur IA sécurisé côté serveur.</p></div><div class="card"><textarea id="q" class="input" rows="4" placeholder="Pose ta question..."></textarea><button class="primary" onclick="ask()">ANALYSER</button><div id="ans"></div></div>`}
function ask(){document.getElementById('ans').innerHTML='<div class="card" style="margin-top:10px"><b>BE STRONGER IA</b><p class="muted">La V20 prépare l’intégration serveur : historique, programme, charges et objectifs pourront être transmis au moteur IA sans exposer les clés côté client.</p></div>'}
function payments(){
 if(S.user.role!=='coach'){
   const included=S.user.access==='coaching';
   return `<div class="hero"><h1>${included?'Ton accès est':'Passe à'} <span class="red">${included?'inclus.':'Premium.'}</span></h1>
   <p class="muted">${included?'Ton coaching est déjà payé : tu ne paies pas l’application une deuxième fois.':'Accède à BE STRONGER sans coaching individuel.'}</p>
   <div class="payGrid">
   <div class="payCard"><span class="badge">${included?'COACHING INCLUS':'PREMIUM'}</span><h2>${included?'Accès inclus avec ton coach':'BE STRONGER Premium'}</h2>
   <ul><li>Programmes d’entraînement</li><li>Timer WOD</li><li>Progression</li><li>Coach IA</li><li>Outils nutrition</li></ul>
   ${included?'<div class="success">✓ Aucun abonnement supplémentaire requis pour l’accès inclus.</div>':'<button class="primary" onclick="startCheckout()">DÉMARRER PREMIUM — 9,90 €/MOIS</button>'}</div>
   <div class="card"><h3>Besoin d’un coach ?</h3><p class="muted">Ton coach peut t’envoyer une invitation. Elle transforme ton accès en coaching inclus.</p><button class="secondary" onclick="authMsg('Utilise le code reçu de ton coach à l’inscription.')">J’AI UN CODE COACH</button></div>
   </div></div>`;
 }
 return `<div class="hero"><h1>Accès & <span class="red">paiements.</span></h1><p class="muted">Un client déjà coaché ne paie pas deux fois.</p></div>
 <div class="grid3">${stat('✓',S.clients.filter(x=>x.access==='coaching').length,'Coaching inclus')}${stat('★',S.clients.filter(x=>x.access==='premium').length,'Premium')}${stat('€','9,90','Premium / mois')}</div>
 <div class="card section"><h3>Flux commercial</h3><p class="muted">Instagram → inscription → choix “déjà coaché” ou “autonome” → validation serveur → accès.</p></div>`;
}
async function startCheckout(){
 if(!sb)return toast('Configure Supabase puis le checkout serveur.');
 const {data,error}=await sb.functions.invoke('create-checkout',{body:{price_eur:9.90}});
 if(error)return toast(error.message);
 if(data?.url)window.location.href=data.url;else toast('Checkout non configuré.');
}

function settings(){return `<div class="hero"><h1>Réglages.</h1><p class="muted">V20 : le compte réel est piloté par Supabase. Le mode démo peut être utilisé pour tester l’interface.</p></div><div class="card"><div class="form"><input id="sn" class="input" value="${S.user.name}"><input id="se" class="input" value="${S.user.email}"><input id="sw" class="input" value="${S.weight}" placeholder="Poids"></div><button class="primary" onclick="settingsSave()">ENREGISTRER</button></div>`}
function settingsSave(){S.user.name=document.getElementById('sn').value;S.user.email=document.getElementById('se').value;S.weight=document.getElementById('sw').value;save();boot();toast('Enregistré')}
function profil(){return `<div class="hero"><h1>Mon <span class="red">profil.</span></h1></div><div class="card"><h2>${S.user.name}</h2><p class="muted">${S.user.email}</p><p>Rôle : <b>${S.user.role}</b></p><p>Accès : <b>${S.user.access}</b></p></div>`}
function modal(x){document.getElementById('modalContent').innerHTML=x;document.getElementById('modal').classList.remove('hidden')}function closeModal(){document.getElementById('modal').classList.add('hidden')}function toast(x){const t=document.createElement('div');t.className='toast';t.textContent=x;document.body.appendChild(t);setTimeout(()=>t.remove(),1800)}
async function logout(){if(sb)await sb.auth.signOut();localStorage.removeItem(KEY);location.reload()}
start();
