/*
  scenarios.js
  ---------------------------------------------------------
  Este archivo solo se encarga de generar los 4 escenarios.
  La tabla comparativa, BFS, DFS, UCS y A* siguen estando en script.js.
*/

loadScenario = function(type){
  if(running) return;

  const rand = (min,max) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  const clamp = (value,min,max) =>
    Math.max(min, Math.min(max, value));

  // Vaciar tablero usando EXACTAMENTE la misma estructura que script.js.
  for(let r=0; r<ROWS; r++){
    for(let c=0; c<COLS; c++){
      board[r][c].wall = false;
      board[r][c].cost = 1;
    }
  }

  goals = [];

  // =========================================================
  // 1. MENOS PASOS
  // =========================================================
  if(type === "steps"){
    const row = rand(5,14);

    start = {
      r: row,
      c: rand(1,2)
    };

    // Meta cercana.
    const nearGoal = {
      r: clamp(row + rand(-2,2), 2, 17),
      c: rand(8,10),
      penalty: 0,
      id: 1
    };

    // Meta claramente más lejana.
    const farGoal = {
      r: rand(2,17),
      c: rand(16,18),
      penalty: 0,
      id: 2
    };

    goals = [nearGoal, farGoal];

    // Barrera con abertura para obligar a hacer un recorrido.
    const wallCol = rand(5,7);
    const gapRow = clamp(row + rand(-1,1), 1, 18);

    for(let r=1; r<ROWS-1; r++){
      if(Math.abs(r-gapRow) <= 1) continue;
      board[r][wallCol].wall = true;
    }

    // Obstáculos decorativos aleatorios.
    for(let i=0; i<16; i++){
      const r = rand(1,18);
      const c = rand(3,14);

      if(
        (r === start.r && c === start.c) ||
        goals.some(g => g.r === r && g.c === c) ||
        c === wallCol
      ) continue;

      if(Math.random() < 0.45){
        board[r][c].wall = true;
      }
    }

    readyBadge.innerHTML =
      "<span></span> Escenario generado: Menos pasos";
  }

  // =========================================================
  // 2. PESOS
  // Ruta directa corta y cara + rodeo algo más largo y barato.
  // =========================================================
  else if(type === "weights"){
    const mainRow = rand(6,13);
    const detourDirection = mainRow < 10 ? 1 : -1;
    const detourRow = clamp(mainRow + detourDirection * rand(3,4), 1, 18);

    start = {
      r: mainRow,
      c: 1
    };

    const goal = {
      r: mainRow,
      c: rand(16,18),
      penalty: 0,
      id: 1
    };

    goals = [goal];

    // Camino directo: completamente libre, pero con pesos altos.
    for(let c=2; c<goal.c; c++){
      board[mainRow][c].wall = false;
      board[mainRow][c].cost = rand(6,9);
    }

    // Rodeo barato: corredor vertical + horizontal + vertical.
    for(let r=Math.min(mainRow,detourRow);
        r<=Math.max(mainRow,detourRow);
        r++){
      board[r][start.c].wall = false;
      board[r][start.c].cost = 1;

      board[r][goal.c].wall = false;
      board[r][goal.c].cost = 1;
    }

    for(let c=start.c; c<=goal.c; c++){
      board[detourRow][c].wall = false;
      board[detourRow][c].cost = 1;
    }

    // Obstáculos fuera de los dos caminos.
    for(let i=0; i<25; i++){
      const r = rand(1,18);
      const c = rand(2,17);

      const onDirect = r === mainRow && c >= start.c && c <= goal.c;
      const onDetourHorizontal =
        r === detourRow && c >= start.c && c <= goal.c;
      const onDetourVertical =
        (c === start.c || c === goal.c) &&
        r >= Math.min(mainRow,detourRow) &&
        r <= Math.max(mainRow,detourRow);

      if(onDirect || onDetourHorizontal || onDetourVertical) continue;

      if(Math.random() < 0.40){
        board[r][c].wall = true;
      }
    }

    readyBadge.innerHTML =
      "<span></span> Escenario generado: Pesos";
  }

  // =========================================================
  // 3. META CON COSTE
  // Meta cercana con penalización + meta lejana sin penalización.
  // =========================================================
  else if(type === "goal-cost"){
    const row = rand(6,13);

    start = {
      r: row,
      c: 2
    };

    const nearCol = rand(7,9);
    const farCol = rand(15,18);

    // La penalización se calcula para garantizar que la meta cercana
    // termine siendo más cara en coste total que la lejana.
    const nearDistance = nearCol - start.c;
    const farDistance = farCol - start.c;
    const penalty = (farDistance - nearDistance) + rand(8,15);

    const nearGoal = {
      r: row,
      c: nearCol,
      penalty,
      id: 1
    };

    const farGoal = {
      r: row,
      c: farCol,
      penalty: 0,
      id: 2
    };

    goals = [nearGoal, farGoal];

    // Corredor principal libre para que ambas metas sean alcanzables.
    for(let c=start.c; c<=farGoal.c; c++){
      board[row][c].wall = false;
      board[row][c].cost = 1;
    }

    // Obstáculos alrededor, sin cerrar el corredor.
    for(let i=0; i<24; i++){
      const r = rand(1,18);
      const c = rand(4,17);

      if(r === row) continue;
      if(
        (r === start.r && c === start.c) ||
        goals.some(g => g.r === r && g.c === c)
      ) continue;

      if(Math.random() < 0.45){
        board[r][c].wall = true;
      }
    }

    goalCost.value = penalty;

    readyBadge.innerHTML =
      "<span></span> Escenario generado: Meta con coste";
  }

  // =========================================================
  // 4. SIN SOLUCIÓN
  // Barrera completa que separa inicio y meta.
  // =========================================================
  else if(type === "no-solution"){
    const barrierCol = rand(8,11);

    start = {
      r: rand(4,15),
      c: rand(1,barrierCol-3)
    };

    goals = [{
      r: rand(4,15),
      c: rand(barrierCol+3,18),
      penalty: 0,
      id: 1
    }];

    // Barrera de arriba abajo sin huecos.
    for(let r=0; r<ROWS; r++){
      board[r][barrierCol].wall = true;
      board[r][barrierCol].cost = 1;
    }

    // Algunos obstáculos extra para que el dibujo cambie en cada clic.
    for(let i=0; i<20; i++){
      const r = rand(1,18);
      const c = rand(1,18);

      if(
        c === barrierCol ||
        (r === start.r && c === start.c) ||
        goals.some(g => g.r === r && g.c === c)
      ) continue;

      if(Math.random() < 0.35){
        board[r][c].wall = true;
      }
    }

    readyBadge.innerHTML =
      "<span></span> Escenario generado: Sin solución";
  }

  // Dejar S y M siempre válidas.
  board[start.r][start.c].wall = false;
  board[start.r][start.c].cost = 1;

  for(const goal of goals){
    board[goal.r][goal.c].wall = false;
    board[goal.r][goal.c].cost = 1;
  }

  cursor = {...start};

  // Pintar el escenario y marcar que el tablero ha cambiado.
  paintAll();
  mapChanged();
};
