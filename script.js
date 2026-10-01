const ROWS=20,COLS=20;
const $=id=>document.getElementById(id);
const grid=$("grid"),algorithm=$("algorithm"),algorithmInfo=$("algorithmInfo"),methodInfo=$("methodInfo"),speed=$("speed"),showExploration=$("showExploration");
const runBtn=$("runBtn"),compareBtn=$("compareBtn"),pauseBtn=$("pauseBtn"),randomBtn=$("randomBtn"),clearBtn=$("clearBtn"),readyBadge=$("readyBadge"),routeBadge=$("routeBadge"),toolHint=$("toolHint");
const tileWeight=$("tileWeight"),goalCost=$("goalCost"),randomGoals=$("randomGoals"),randomGoalsBtn=$("randomGoalsBtn");
const metricStatus=$("metricStatus"),metricGoal=$("metricGoal"),metricExplored=$("metricExplored"),metricSteps=$("metricSteps"),metricRouteCost=$("metricRouteCost"),metricGoalCost=$("metricGoalCost"),metricTotal=$("metricTotal");
const comparison=$("comparison"),comparisonContent=$("comparisonContent");
const comparisonTableBody=$("comparisonTableBody"),alternateRoutesBtn=$("alternateRoutesBtn"),overlayRoutesBtn=$("overlayRoutesBtn"),comparisonAlgorithm=$("comparisonAlgorithm");
const comparisonSummary=$("comparisonSummary"),summarySteps=$("summarySteps"),summaryCost=$("summaryCost"),summaryExplored=$("summaryExplored");
const metaWarning=$("metaWarning"),closeMetaWarning=$("closeMetaWarning");
const mapRevisionLabel=$("mapRevisionLabel");
const toolButtons=[...document.querySelectorAll(".tool")],scenarioButtons=[...document.querySelectorAll("[data-scenario]")];
const dirs=[[-1,0],[0,1],[1,0],[0,-1]];
let board=[],running=false,paused=false,drawing=false,mode="wall",start={r:1,c:1},goals=[{r:18,c:18,penalty:0,id:1}],cursor={r:1,c:1};
let lastComparisonResults={},comparisonDisplayMode="single";
let mapRevision=1;
const descriptions={
 bfs:{title:"BFS · Búsqueda en anchura",text:"Explora por niveles y encuentra la meta a menos pasos. No tiene en cuenta los pesos de las baldosas.",criterion:"Prioriza la profundidad: primero todos los nodos a distancia 1, luego 2, luego 3..."},
 dfs:{title:"DFS · Búsqueda en profundidad",text:"Avanza por una rama antes de retroceder. Sirve para comparar, pero no garantiza una ruta óptima.",criterion:"Prioriza profundizar todo lo posible antes de volver atrás."},
 ucs:{title:"UCS · Coste Uniforme",text:"Prioriza el menor coste acumulado e incorpora los pesos de las baldosas y el coste de cada meta.",criterion:"Prioriza g(n), el coste real acumulado desde el inicio."},
 astar:{title:"A* · Búsqueda heurística",text:"Combina el coste acumulado con una estimación de la distancia restante hasta la meta.",criterion:"Prioriza f(n) = g(n) + h(n), usando distancia Manhattan como heurística."}
};
function updateAlgorithmCards(){const d=descriptions[algorithm.value];algorithmInfo.innerHTML=`<span class="algo-title">${d.title}</span>${d.text}<span class="criterion"><b>Criterio:</b> ${d.criterion}</span>`;methodInfo.innerHTML=`<span class="method-title">${d.title}</span>${d.text}<br><br><b>Criterio:</b> ${d.criterion}`}
function isStart(r,c){return r===start.r&&c===start.c} function goalIndexAt(r,c){return goals.findIndex(g=>g.r===r&&g.c===c)} function isGoal(r,c){return goalIndexAt(r,c)!==-1} function key(r,c){return `${r},${c}`} function fromKey(v){const [r,c]=v.split(",").map(Number);return {r,c}} function goalFromKey(v){const p=fromKey(v);return goals.find(g=>g.r===p.r&&g.c===p.c)||null}


function resetComparisonToZero(){
  lastComparisonResults={};

  comparisonTableBody.innerHTML=`
    <tr data-alg="bfs">
      <td>BFS</td><td>—</td><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td><td>0.00 ms</td><td>Sin calcular</td>
    </tr>
    <tr data-alg="dfs">
      <td>DFS</td><td>—</td><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td><td>0.00 ms</td><td>Sin calcular</td>
    </tr>
    <tr data-alg="ucs">
      <td>Coste Uniforme</td><td>—</td><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td><td>0.00 ms</td><td>Sin calcular</td>
    </tr>
    <tr data-alg="astar">
      <td>A*</td><td>—</td><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td><td>0.00 ms</td><td>Sin calcular</td>
    </tr>
  `;

  summarySteps.textContent="0";
  summaryCost.textContent="0";
  summaryExplored.textContent="0";
  comparisonSummary.classList.remove("hidden");

  alternateRoutesBtn.disabled=true;
  overlayRoutesBtn.disabled=true;
  comparisonAlgorithm.disabled=true;

  alternateRoutesBtn.classList.remove("active");
  overlayRoutesBtn.classList.remove("active");

  clearComparisonRouteClasses();

  if(mapRevisionLabel){
    mapRevisionLabel.textContent="Sin comparar";
  }
}

function mapChanged(){
  mapRevision++;

  clearSearchVisuals();
  resetMetrics();
  routeBadge.innerHTML="<span></span> Sin ruta";

  // El mapa ha cambiado: los resultados anteriores ya no sirven.
  // La tabla permanece a cero hasta pulsar "Comparar todos".
  resetComparisonToZero();
}

function createBoard(){board=Array.from({length:ROWS},()=>Array.from({length:COLS},()=>({wall:false,cost:1,el:null})));renderBoard()}
function renderBoard(){grid.innerHTML="";for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){const el=document.createElement("div");el.className="cell";board[r][c].el=el;el.addEventListener("mousedown",e=>{e.preventDefault();if(running)return;drawing=true;cursor={r,c};editCell(r,c);paintAll();grid.focus()});el.addEventListener("mouseenter",()=>{if(!drawing||running)return;if(["wall","erase","weight"].includes(mode)){cursor={r,c};editCell(r,c);paintAll()}});grid.appendChild(el)}paintAll()}
document.addEventListener("mouseup",()=>{const changed=drawing;drawing=false;if(changed&&!running)mapChanged()});
function paintAll(){for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)paintCell(r,c)}
function paintCell(r,c){const d=board[r][c],el=d.el;if(!el)return;const explored=el.classList.contains("explored"),path=el.classList.contains("path");el.className="cell";el.textContent=d.cost>1?`x${d.cost}`:"";if(d.cost>1&&!d.wall)el.classList.add("weighted");if(d.wall)el.classList.add("wall");if(explored)el.classList.add("explored");if(path)el.classList.add("path");if(isStart(r,c))el.classList.add("start");if(isGoal(r,c))el.classList.add("goal");if(cursor.r===r&&cursor.c===c)el.classList.add("cursor")}
function setMode(m){mode=m;toolButtons.forEach(b=>b.classList.toggle("active",b.dataset.mode===m));const names={wall:"obstáculo",erase:"borrar",start:"inicio",goal:"meta",weight:"peso"};toolHint.textContent=`Herramienta activa: ${names[m]}. Haz clic o arrastra para pintar. Con teclado, usa flechas y Enter.`}
function editCell(r,c){if(mode==="wall"){if(isStart(r,c)||isGoal(r,c))return;board[r][c].wall=true;board[r][c].cost=1}else if(mode==="erase"){if(isStart(r,c))return;const i=goalIndexAt(r,c);if(i>=0)goals.splice(i,1);board[r][c].wall=false;board[r][c].cost=1}else if(mode==="start"){if(isGoal(r,c))return;start={r,c};board[r][c].wall=false}else if(mode==="goal"){if(isStart(r,c))return;board[r][c].wall=false;const penalty=Math.max(0,Number(goalCost.value)||0),i=goalIndexAt(r,c);if(i>=0)goals[i].penalty=penalty;else goals.push({r,c,penalty,id:goals.length?Math.max(...goals.map(g=>g.id||0))+1:1})}else if(mode==="weight"){if(isStart(r,c)||isGoal(r,c)||board[r][c].wall)return;board[r][c].cost=Math.max(1,Math.min(99,Number(tileWeight.value)||1))}resetMetrics();routeBadge.innerHTML="<span></span> Sin ruta"}
grid.addEventListener("keydown",e=>{if(running)return;let moved=false;if(e.key==="ArrowUp"){cursor.r=Math.max(0,cursor.r-1);moved=true}if(e.key==="ArrowDown"){cursor.r=Math.min(ROWS-1,cursor.r+1);moved=true}if(e.key==="ArrowLeft"){cursor.c=Math.max(0,cursor.c-1);moved=true}if(e.key==="ArrowRight"){cursor.c=Math.min(COLS-1,cursor.c+1);moved=true}if(moved){e.preventDefault();paintAll()}if(e.key==="Enter"){e.preventDefault();editCell(cursor.r,cursor.c);paintAll();mapChanged()}});
function neighbors(r,c){const out=[];for(const [dr,dc] of dirs){const nr=r+dr,nc=c+dc;if(nr>=0&&nr<ROWS&&nc>=0&&nc<COLS&&!board[nr][nc].wall)out.push({r:nr,c:nc})}return out}
function clearSearchVisuals(){for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){const el=board[r][c].el;if(el)el.classList.remove("explored","path","compare-bfs","compare-dfs","compare-ucs","compare-astar","compare-overlap")}}
function resetMetrics(){metricStatus.textContent="Preparado";metricGoal.textContent="—";metricExplored.textContent="0";metricSteps.textContent="0";metricRouteCost.textContent="0";metricGoalCost.textContent="0";metricTotal.textContent="0"}
function clearSearch(){
  clearSearchVisuals();
  resetMetrics();
  comparison.classList.add("hidden");
  comparisonContent.innerHTML="";
  routeBadge.innerHTML="<span></span> Sin ruta";
  readyBadge.innerHTML="<span></span> Listo para jugar";
  paintAll();
  resetComparisonToZero();
}

function clearBoard(){start={r:1,c:1};goals=[{r:18,c:18,penalty:0,id:1}];for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){board[r][c].wall=false;board[r][c].cost=1}cursor={...start};clearSearch()}
function randomMaze(){
  if(running)return;

  // Vaciar el tablero sin fijar inicio/meta.
  for(let r=0;r<ROWS;r++){
    for(let c=0;c<COLS;c++){
      board[r][c].wall=false;
      board[r][c].cost=1;
    }
  }

  // Inicio aleatorio.
  start={
    r:Math.floor(Math.random()*ROWS),
    c:Math.floor(Math.random()*COLS)
  };

  // Meta aleatoria distinta del inicio.
  let gr,gc;
  do{
    gr=Math.floor(Math.random()*ROWS);
    gc=Math.floor(Math.random()*COLS);
  }while(gr===start.r&&gc===start.c);

  goals=[{
    r:gr,
    c:gc,
    penalty:Math.max(0,Number(goalCost.value)||0),
    id:1
  }];

  // Obstáculos y pesos aleatorios.
  for(let r=0;r<ROWS;r++){
    for(let c=0;c<COLS;c++){
      if(isStart(r,c)||isGoal(r,c))continue;

      board[r][c].wall=Math.random()<0.22;
      board[r][c].cost=1;

      if(!board[r][c].wall&&Math.random()<0.11){
        board[r][c].cost=2+Math.floor(Math.random()*8);
      }
    }
  }

  // Asegurar que inicio y meta estén libres.
  board[start.r][start.c].wall=false;
  board[gr][gc].wall=false;

  // Abrir una ruta Manhattan aleatoria entre S y M para que el
  // escenario generado tenga al menos una solución.
  let cr=start.r;
  let cc=start.c;

  const horizontalFirst=Math.random()<0.5;

  function clearCell(r,c){
    board[r][c].wall=false;
    if(!isStart(r,c)&&!isGoal(r,c)){
      board[r][c].cost=1;
    }
  }

  clearCell(cr,cc);

  if(horizontalFirst){
    while(cc!==gc){
      cc+=gc>cc?1:-1;
      clearCell(cr,cc);
    }
    while(cr!==gr){
      cr+=gr>cr?1:-1;
      clearCell(cr,cc);
    }
  }else{
    while(cr!==gr){
      cr+=gr>cr?1:-1;
      clearCell(cr,cc);
    }
    while(cc!==gc){
      cc+=gc>cc?1:-1;
      clearCell(cr,cc);
    }
  }

  cursor={...start};
  clearSearch();
  paintAll();

  readyBadge.innerHTML="<span></span> Escenario aleatorio";
  routeBadge.innerHTML="<span></span> Sin ruta";
  mapChanged();
}
function loadScenario(type){if(running)return;clearBoard();if(type==="steps"){start={r:10,c:1};goals=[{r:10,c:8,penalty:0,id:1},{r:3,c:16,penalty:0,id:2}];for(let r=5;r<=15;r++)if(r!==10)board[r][5].wall=true}else if(type==="weights"){start={r:10,c:1};goals=[{r:10,c:18,penalty:0,id:1}];for(let c=4;c<=15;c++)board[10][c].cost=9;for(let c=4;c<=15;c++)if(c!==9&&c!==10)board[8][c].wall=true}else if(type==="goal-cost"){start={r:10,c:2};goals=[{r:10,c:8,penalty:20,id:1},{r:10,c:17,penalty:0,id:2}];goalCost.value=20;for(let r=5;r<=15;r++)if(r!==12)board[r][12].wall=true}else if(type==="no-solution"){start={r:10,c:3};goals=[{r:10,c:16,penalty:0,id:1}];for(let r=0;r<ROWS;r++)board[r][10].wall=true}cursor={...start};clearSearch();paintAll();readyBadge.innerHTML="<span></span> Escenario cargado";mapChanged()}
function makeRandomGoals(){if(running)return;const amount=Math.max(1,Math.min(12,Number(randomGoals.value)||1)),penalty=Math.max(0,Number(goalCost.value)||0);goals=[];let tries=0;while(goals.length<amount&&tries<4000){tries++;const r=Math.floor(Math.random()*ROWS),c=Math.floor(Math.random()*COLS);if(isStart(r,c)||board[r][c].wall||isGoal(r,c))continue;goals.push({r,c,penalty,id:goals.length+1})}clearSearch();paintAll();mapChanged()}
function rebuildPath(parent,endKey){if(!endKey)return[];const path=[];let current=endKey;while(current){path.push(fromKey(current));current=parent.get(current)??null}return path.reverse()}
function routeCost(path){let total=0;for(let i=1;i<path.length;i++)total+=board[path[i].r][path[i].c].cost;return total}
function bfs(){if(!goals.length)return{order:[],path:[],goal:null};const q=[start],seen=new Set([key(start.r,start.c)]),parent=new Map(),order=[];let head=0,end=null;while(head<q.length){const cur=q[head++];order.push(cur);if(isGoal(cur.r,cur.c)){end=key(cur.r,cur.c);break}for(const n of neighbors(cur.r,cur.c)){const nk=key(n.r,n.c);if(!seen.has(nk)){seen.add(nk);parent.set(nk,key(cur.r,cur.c));q.push(n)}}}return{order,path:rebuildPath(parent,end),goal:end?goalFromKey(end):null}}
function dfs(){if(!goals.length)return{order:[],path:[],goal:null};const st=[start],seen=new Set(),parent=new Map(),order=[];let end=null;while(st.length){const cur=st.pop(),ck=key(cur.r,cur.c);if(seen.has(ck))continue;seen.add(ck);order.push(cur);if(isGoal(cur.r,cur.c)){end=ck;break}for(const n of neighbors(cur.r,cur.c).reverse()){const nk=key(n.r,n.c);if(!seen.has(nk)){if(!parent.has(nk))parent.set(nk,ck);st.push(n)}}}return{order,path:rebuildPath(parent,end),goal:end?goalFromKey(end):null}}
function ucs(){if(!goals.length)return{order:[],path:[],goal:null};const sk=key(start.r,start.c),pq=[{...start,p:0}],dist=new Map([[sk,0]]),parent=new Map(),closed=new Set(),order=[];let best=Infinity,end=null,gSel=null;while(pq.length){pq.sort((a,b)=>a.p-b.p);const cur=pq.shift(),ck=key(cur.r,cur.c);if(closed.has(ck))continue;if(cur.p>=best)break;closed.add(ck);order.push(cur);if(isGoal(cur.r,cur.c)){const g=goalFromKey(ck),total=dist.get(ck)+(g?.penalty||0);if(total<best){best=total;end=ck;gSel=g}continue}for(const n of neighbors(cur.r,cur.c)){const nk=key(n.r,n.c),nc=dist.get(ck)+board[n.r][n.c].cost;if(!dist.has(nk)||nc<dist.get(nk)){dist.set(nk,nc);parent.set(nk,ck);pq.push({...n,p:nc})}}}return{order,path:rebuildPath(parent,end),goal:gSel}}
function h(r,c){return goals.length?Math.min(...goals.map(g=>Math.abs(r-g.r)+Math.abs(c-g.c))):0}
function astar(){if(!goals.length)return{order:[],path:[],goal:null};const sk=key(start.r,start.c),open=[{...start,p:h(start.r,start.c)}],gs=new Map([[sk,0]]),parent=new Map(),closed=new Set(),order=[];let best=Infinity,end=null,gSel=null;while(open.length){open.sort((a,b)=>a.p-b.p);const cur=open.shift(),ck=key(cur.r,cur.c);if(closed.has(ck))continue;if(cur.p>=best)break;closed.add(ck);order.push(cur);if(isGoal(cur.r,cur.c)){const g=goalFromKey(ck),total=gs.get(ck)+(g?.penalty||0);if(total<best){best=total;end=ck;gSel=g}continue}for(const n of neighbors(cur.r,cur.c)){const nk=key(n.r,n.c);if(closed.has(nk))continue;const ng=gs.get(ck)+board[n.r][n.c].cost;if(!gs.has(nk)||ng<gs.get(nk)){gs.set(nk,ng);parent.set(nk,ck);open.push({...n,p:ng+h(n.r,n.c)})}}}return{order,path:rebuildPath(parent,end),goal:gSel}}
function getAlgorithmFn(v){return v==="bfs"?bfs:v==="dfs"?dfs:v==="ucs"?ucs:astar} function algorithmName(v){return{bfs:"BFS",dfs:"DFS",ucs:"Coste Uniforme",astar:"A*"}[v]} function animationDelay(){return Math.max(2,105-Number(speed.value))} function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms))} async function waitPause(){while(paused)await sleep(80)}
async function animate(result){if(showExploration.checked){for(const n of result.order){await waitPause();if(isStart(n.r,n.c)||isGoal(n.r,n.c))continue;board[n.r][n.c].el.classList.add("explored");await sleep(animationDelay())}}for(const n of result.path){await waitPause();if(isStart(n.r,n.c)||isGoal(n.r,n.c))continue;board[n.r][n.c].el.classList.remove("explored");board[n.r][n.c].el.classList.add("path");await sleep(Math.max(6,animationDelay()))}}
function setLocked(v){runBtn.disabled=v;compareBtn.disabled=v;randomBtn.disabled=v;clearBtn.disabled=v;algorithm.disabled=v;randomGoalsBtn.disabled=v;toolButtons.forEach(b=>b.disabled=v);scenarioButtons.forEach(b=>b.disabled=v)}
function setMetrics(result,alg,elapsed){
  if(!result.path.length||!result.goal){
    metricStatus.textContent="Sin solución";metricGoal.textContent="—";metricExplored.textContent=result.order.length;metricSteps.textContent="—";metricRouteCost.textContent="—";metricGoalCost.textContent="—";metricTotal.textContent="—";routeBadge.innerHTML="<span style=\'background:#ef4444\'></span> Sin ruta";return
  }
  const rc=routeCost(result.path),gc=result.goal.penalty||0,total=rc+gc;
  metricStatus.textContent=`Meta alcanzada · ${elapsed.toFixed(2)} ms`;metricGoal.textContent=`M${result.goal.id}`;metricExplored.textContent=result.order.length;metricSteps.textContent=result.path.length-1;metricRouteCost.textContent=rc;metricGoalCost.textContent=gc;metricTotal.textContent=total;routeBadge.innerHTML=`<span></span> Ruta a M${result.goal.id}`
}

function showMetaWarning(){
  if(!metaWarning)return;

  metaWarning.classList.remove("hidden");

  clearTimeout(showMetaWarning.timer);
  showMetaWarning.timer=setTimeout(()=>{
    metaWarning.classList.add("hidden");
  },3500);
}

async function runSearch(){
  if(running)return;
  if(!goals.length){
    showMetaWarning();
    return;
  }
  running=true;paused=false;pauseBtn.textContent="⏸ Pausar";readyBadge.innerHTML="<span style=\'background:#facc15\'></span> Ejecutando";setLocked(true);clearSearchVisuals();
  const alg=algorithm.value,t0=performance.now(),result=getAlgorithmFn(alg)(),t1=performance.now();
  setMetrics(result,alg,t1-t0);
  if(result.path.length)await animate(result);
  running=false;paused=false;pauseBtn.textContent="⏸ Pausar";readyBadge.innerHTML="<span></span> Listo para jugar";setLocked(false);
}
function calculateComparisonRows(){
  const rows=[];

  for(const alg of ["bfs","dfs","ucs","astar"]){
    const t0=performance.now();
    const result=getAlgorithmFn(alg)();
    const t1=performance.now();

    const rc=result.path.length?routeCost(result.path):null;
    const gc=result.goal?(result.goal.penalty||0):null;
    const total=result.path.length?rc+gc:null;
    const steps=result.path.length?result.path.length-1:null;

    let observation="";

    if(!result.path.length){
      observation="No hay ruta posible desde S hasta ninguna meta en el mapa actual.";
    }else if(alg==="bfs"){
      observation=`BFS encontró ${steps} pasos. Para decidir ignora pesos y coste de meta; después medimos el coste real de su ruta (${total}).`;
    }else if(alg==="dfs"){
      observation=`DFS encontró una ruta de ${steps} pasos. No garantiza ni menos pasos ni menor coste; su coste real es ${total}.`;
    }else if(alg==="ucs"){
      observation=`UCS sí usa pesos y coste de meta. La ruta elegida tiene coste total ${total}.`;
    }else{
      observation=`A* usa coste + heurística Manhattan. La ruta elegida cuesta ${total} y exploró ${result.order.length} nodos.`;
    }

    rows.push({
      alg,
      explored:result.order.length,
      steps:steps===null?"—":steps,
      routeCost:rc===null?"—":rc,
      goalCost:gc===null?"—":gc,
      total:total===null?"—":total,
      goal:result.goal?`M${result.goal.id}`:"—",
      time:(t1-t0).toFixed(2),
      observation,
      result
    });
  }

  return rows;
}

function renderComparisonTable(rows,selectedAlg=algorithm.value){
  lastComparisonResults={};
  for(const row of rows)lastComparisonResults[row.alg]=row;

  const solved=rows.filter(r=>r.total!=="—");
  const minSteps=solved.length?Math.min(...solved.map(r=>Number(r.steps))):null;
  const minCost=solved.length?Math.min(...solved.map(r=>Number(r.total))):null;
  const minExplored=rows.length?Math.min(...rows.map(r=>Number(r.explored))):null;

  comparisonTableBody.dataset.revision=String(mapRevision);
  comparisonTableBody.innerHTML=rows.map(r=>{
    const stepsBest=r.steps!=="—"&&Number(r.steps)===minSteps;
    const costBest=r.total!=="—"&&Number(r.total)===minCost;
    const exploredBest=Number(r.explored)===minExplored;

    return `
      <tr data-alg="${r.alg}" class="${r.alg===selectedAlg?'selected-row':''}">
        <td>${algorithmName(r.alg)}</td>
        <td>${r.goal}</td>
        <td class="${exploredBest?'best-metric':''}">${r.explored}</td>
        <td class="${stepsBest?'best-metric':''}">${r.steps}</td>
        <td>${r.routeCost}</td>
        <td>${r.goalCost}</td>
        <td class="${costBest?'best-metric':''}">${r.total}</td>
        <td>${r.time} ms</td>
        <td class="comparison-observation">${r.observation}</td>
      </tr>
    `;
  }).join("");

  const namesFor=fn=>rows.filter(fn).map(r=>algorithmName(r.alg)).join(" / ");

  summarySteps.textContent=minSteps===null
    ?"Sin solución"
    :`${namesFor(r=>r.steps!=="—"&&Number(r.steps)===minSteps)} · ${minSteps} pasos`;

  summaryCost.textContent=minCost===null
    ?"Sin solución"
    :`${namesFor(r=>r.total!=="—"&&Number(r.total)===minCost)} · coste ${minCost}`;

  summaryExplored.textContent=minExplored===null
    ?"—"
    :`${namesFor(r=>Number(r.explored)===minExplored)} · ${minExplored} nodos`;

  comparisonSummary.classList.remove("hidden");
}

function refreshComparisonTable(){
  resetComparisonToZero();
}

function resetComparisonTable(){
  resetComparisonToZero();
}

function compareAll(){
  if(running||!goals.length)return;

  clearSearchVisuals();

  // SOLO AQUÍ se calculan los datos de la tabla.
  // Se usan exactamente el board, start y goals que hay ahora mismo.
  const rows=calculateComparisonRows();
  renderComparisonTable(rows,comparisonAlgorithm.value||algorithm.value);

  alternateRoutesBtn.disabled=false;
  overlayRoutesBtn.disabled=false;
  comparisonAlgorithm.disabled=false;

  if(mapRevisionLabel){
    mapRevisionLabel.textContent=`Comparado · mapa versión ${mapRevision}`;
  }

  comparisonDisplayMode="single";
  alternateRoutesBtn.classList.add("active");
  overlayRoutesBtn.classList.remove("active");
  drawComparisonRoutes();
}

function drawOneComparisonPath(alg){
  const row=lastComparisonResults[alg];
  if(!row||!row.result||!row.result.path.length)return;

  for(const node of row.result.path){
    if(isStart(node.r,node.c)||isGoal(node.r,node.c))continue;
    board[node.r][node.c].el.classList.add(`compare-${alg}`);
  }
}

function drawComparisonRoutes(){
  clearSearchVisuals();

  if(!Object.keys(lastComparisonResults).length)return;

  if(comparisonDisplayMode==="overlay"){
    const counts=new Map();

    for(const alg of ["bfs","dfs","ucs","astar"]){
      const row=lastComparisonResults[alg];
      if(!row||!row.result)continue;

      for(const node of row.result.path){
        if(isStart(node.r,node.c)||isGoal(node.r,node.c))continue;

        const kk=key(node.r,node.c);
        counts.set(kk,(counts.get(kk)||0)+1);
        board[node.r][node.c].el.classList.add(`compare-${alg}`);
      }
    }

    for(const [kk,count] of counts.entries()){
      if(count>1){
        const p=fromKey(kk);
        board[p.r][p.c].el.classList.add("compare-overlap");
      }
    }
  }else{
    drawOneComparisonPath(comparisonAlgorithm.value);
  }

  document.querySelectorAll("#comparisonTableBody tr[data-alg]").forEach(tr=>{
    tr.classList.toggle(
      "selected-row",
      comparisonDisplayMode==="single" &&
      tr.dataset.alg===comparisonAlgorithm.value
    );
  });
}

toolButtons.forEach(btn=>btn.addEventListener("click",()=>setMode(btn.dataset.mode)));scenarioButtons.forEach(btn=>btn.addEventListener("click",()=>loadScenario(btn.dataset.scenario)));algorithm.addEventListener("change",()=>{updateAlgorithmCards();});

goalCost.addEventListener("input",()=>{
  const value=Math.max(0,Number(goalCost.value)||0);

  // Aplicar el coste introducido a todas las metas existentes.
  // Así la tabla cambia inmediatamente al modificar este dato.
  for(const g of goals){
    g.penalty=value;
  }

  mapChanged();
});

tileWeight.addEventListener("input",()=>{
  // Cambia únicamente el valor que se aplicará al pintar.
});
pauseBtn.addEventListener("click",()=>{if(!running)return;paused=!paused;pauseBtn.textContent=paused?"▶ Reanudar":"⏸ Pausar";readyBadge.innerHTML=paused?"<span style='background:#facc15'></span> Pausado":"<span style='background:#facc15'></span> Ejecutando"});runBtn.addEventListener("click",runSearch);compareBtn.addEventListener("click",compareAll);

if(closeMetaWarning){
  closeMetaWarning.addEventListener("click",()=>{
    metaWarning.classList.add("hidden");
  });
}
randomBtn.addEventListener("click",randomMaze);clearBtn.addEventListener("click",clearSearch);randomGoalsBtn.addEventListener("click",makeRandomGoals);

alternateRoutesBtn.addEventListener("click",()=>{
  const order=["bfs","dfs","ucs","astar"];

  if(comparisonDisplayMode!=="single"){
    comparisonDisplayMode="single";
  }else{
    const current=order.indexOf(comparisonAlgorithm.value);
    comparisonAlgorithm.value=order[(current+1)%order.length];
  }

  alternateRoutesBtn.classList.add("active");
  overlayRoutesBtn.classList.remove("active");
  drawComparisonRoutes();
});

overlayRoutesBtn.addEventListener("click",()=>{
  comparisonDisplayMode="overlay";
  overlayRoutesBtn.classList.add("active");
  alternateRoutesBtn.classList.remove("active");
  drawComparisonRoutes();
});

comparisonAlgorithm.addEventListener("change",()=>{
  comparisonDisplayMode="single";
  alternateRoutesBtn.classList.add("active");
  overlayRoutesBtn.classList.remove("active");
  drawComparisonRoutes();
});

comparisonTableBody.addEventListener("click",e=>{
  const row=e.target.closest("tr[data-alg]");
  if(!row)return;

  comparisonAlgorithm.value=row.dataset.alg;
  comparisonDisplayMode="single";
  alternateRoutesBtn.classList.add("active");
  overlayRoutesBtn.classList.remove("active");
  drawComparisonRoutes();
});

createBoard();
updateAlgorithmCards();

// Inicio limpio: NO se carga ningún escenario de ejemplo.
// La tabla se calcula únicamente con este mapa real y con lo que el usuario edite.
clearBoard();
setMode("wall");
mapRevision=1;
if(mapRevisionLabel)mapRevisionLabel.textContent="Sin comparar";
resetComparisonToZero();
