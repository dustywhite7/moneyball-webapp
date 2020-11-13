// in main.js

function start() {
  var teams = parseInt(document.getElementById("player_count").value);
  salary_cap = parseInt(document.getElementById("salary_cap").value);

  document.getElementById('app').innerHTML = "<h1 class='title'>Player Selection</h1><h3 class='subtitle'>You have selected to play with " + teams + " teams, and a salary cap of $" + salary_cap + " Million.</h3>";

  salary_cap *= 1000000

  document.getElementById('app').innerHTML += "<div id='order'></div>"

  order = d3.shuffle(d3.range(1,teams+1))

  stats = {};
  for (i=0; i<teams; i++) {
    stats[i+1] = {'obp': [], 'slg': [], 'salary': [], 'pNo': []};
  }
  
  makeTable();

  makeDraftList();

  startDraft(order);
}

function makeTable() {
  var table = [];

  for (i=0; i<order.length; i++) {
    table.push([order[i], 0, 0, 0, "On Deck"])
  }

  var tableString = "";
  for (i=0; i<table.length; i++) {
    tableString += "<tr id=team" + table[i][0] + ">";
    tableString += "<td>" +  table[i][0] + "</td>";
    tableString += "<td id=obp" + table[i][0] + ">" +  table[i][1] + "</td>";
    tableString += "<td id=slg" + table[i][0] + ">" +  table[i][2] + "</td>";
    tableString += "<td id=pay" + table[i][0] + ">" +  table[i][3] + "</td>";
    tableString += "<td id=status" + table[i][0] + ">" +  table[i][4] + "</td>";
    tableString += "</tr>";
  }

  tableString = '<table class="table"><thead><tr><th>Team Number</th><th><abbr title="On-Base Percentage">OBP</abbr></th><th><abbr title="Slugging Average">SLG</abbr></th><th>Payroll</th><th>Status</th></tr></thead><tbody>' + tableString + '</tbody></table>'
  
  document.getElementById('order').innerHTML = tableString;



}

function makeDraftList() {
  dropdown = "<div id='available' class='select'><select id='draft'>";

  for (i=0; i<Object.keys( data ).length; i++) {
    if (data[i]['selected']==0) {
      playerName = "";
      playerName += data[i]['first'];
      playerName += " ";
      playerName += data[i]['last'];
      
      dropdown += "<option value=" + i + "> " + data[i]['number'] + " - " + playerName + "</option>";
    }
  }

  dropdown += "</select></div>";

  pick = "<br><br><div class='control'><button type='submit' class='button is-primary' onclick='makePick()'>Submit Pick!</button></div>";

  document.getElementById('order').innerHTML += dropdown + pick;
  // console.log(`${dropdown}`);
}

function updateDraftList() {
  dropdown = "<select id='draft'>";

  for (i=0; i<Object.keys( data ).length; i++) {
    if (data[i]['selected']==0) {
      playerName = "";
      playerName += data[i]['first'];
      playerName += " ";
      playerName += data[i]['last'];
      
      dropdown += "<option value=" + i + "> " + data[i]['number'] + " - " + playerName + "</option>";
    }
  }

  dropdown += "</select>";

  document.getElementById('available').innerHTML = dropdown;
  // console.log(`${dropdown}`);
}

async function grabData() {
  try{
    const response = fetch("https://raw.githubusercontent.com/dustywhite7/moneyball-webapp/master/data/playersheet2020.json");
    const data = await (await response).json();
    // console.log(`Here: ${data.length}`);
    return data;
} catch(e) {
    console.log(`Error: ${e}`)
}
}

function startDraft(order) {
  document.getElementById('order').innerHTML = "<h3 id='roundNo' class='title'>Current Round: " + round + "</h3>" + document.getElementById('order').innerHTML;
  team = 'status' + order[teamOn];
  document.getElementById(team).textContent = "On the clock!";
}


function makePick() {
  team = 'status' + order[teamOn];
  document.getElementById(team).textContent = "Selected";
  player = parseInt(document.getElementById('draft').value);
  stats[order[teamOn]]['pNo'].push(player);
  stats[order[teamOn]]['obp'].push(data[player]['ops']);
  stats[order[teamOn]]['slg'].push(data[player]['slg']);
  stats[order[teamOn]]['salary'].push(data[player]['salary']);
  data[player]['selected'] = 1;
  updateDraftList();
  document.getElementById(`slg${order[teamOn]}`).textContent = d3.mean(stats[order[teamOn]]['slg']).toPrecision(3);
  document.getElementById(`obp${order[teamOn]}`).textContent = d3.mean(stats[order[teamOn]]['obp']).toPrecision(3);
  document.getElementById(`pay${order[teamOn]}`).textContent = d3.format("$,")(d3.sum(stats[order[teamOn]]['salary']));
  if ((teamOn + 1)<order.length) {
    teamOn +=1;
    team = 'status' + order[teamOn];
    document.getElementById(team).textContent = "On the clock!";
    checkBudget();
  } else { 
    advanceRound();
    checkBudget();
    }
}

function checkBudget() {
  if (d3.sum(stats[order[teamOn]]['salary'])>salary_cap) {
    stats[order[teamOn]]['pNo'].push(1);
    stats[order[teamOn]]['obp'].push(0.25);
    stats[order[teamOn]]['slg'].push(0.3);
    stats[order[teamOn]]['salary'].push(535000);
    team = 'status' + order[teamOn];
    try {
      document.getElementById(team).textContent = "Out of Money!";
    } catch(err) {}
    if ((teamOn + 1)<order.length) { 
      teamOn+=1;
      team = 'status' + order[teamOn];
      document.getElementById(team).textContent = "On the clock!";
      checkBudget();
    } else {
      advanceRound();
    }
  }
}

function advanceRound() {
  if ((round + 1) < 10) {
    teamOn = 0;
    round +=1;
    for (j=0; j<order.length; j++) {
      teamFresh = 'status' + order[j];
      document.getElementById(teamFresh).textContent = "On Deck";
    }
    order = order.reverse();
    document.getElementById('roundNo').textContent = `Current Round: ${round}`;
    team = 'status' + order[teamOn];
    document.getElementById(team).textContent = "On the clock!";
    checkBudget();
  } else {
    draftFinal();
  }
}

function draftFinal() {
  document.getElementById('app').innerHTML = "<h1 class='title'>Draft Results</h1><h3 class='subtitle'>Based on the players selected in the draft, team performance is projected as follows:</h3><div id='order'></div>";

  var table = [];

  for (i=0; i<order.length; i++) {
    table.push([i+1, d3.mean(stats[i+1]['obp']).toPrecision(3), d3.mean(stats[i+1]['slg']).toPrecision(3), d3.format("$,")(d3.sum(stats[i+1]['salary'])), (2*d3.mean(stats[i+1]['obp']) + d3.mean(stats[i+1]['slg'])).toPrecision(3)]);
  }

  var tableString = "";
  for (i=0; i<table.length; i++) {
    tableString += "<tr id=team" + table[i][0] + ">";
    tableString += "<td>" +  table[i][0] + "</td>";
    tableString += "<td id=obp" + table[i][0] + ">" +  table[i][1] + "</td>";
    tableString += "<td id=slg" + table[i][0] + ">" +  table[i][2] + "</td>";
    tableString += "<td id=pay" + table[i][0] + ">" +  table[i][3] + "</td>";
    tableString += "<td id=index" + table[i][0] + ">" +  table[i][4] + "</td>";
    tableString += "</tr>";
  }

  tableString = '<table class="table"><thead><tr><th>Team Number</th><th><abbr title="On-Base Percentage">OBP</abbr></th><th><abbr title="Slugging Average">SLG</abbr></th><th>Payroll</th><th><abbr title="Caclulated as 2*OBP + SLG">Team Index</abbr></th></tr></thead><tbody>' + tableString + '</tbody></table>'

  seasonButton = "<br><br><div class='control'><button type='submit' class='button is-primary' onclick='simulateSeason()'>Simulate Season</button></div>";

  document.getElementById('order').innerHTML = tableString + seasonButton;
}

function simulateSeason() {
  document.getElementById('app').innerHTML = "<h1 class='title'>Simulated Season Results</h1><h3 class='subtitle'>Each team plays each opponent 10 times, resulting in the following outcomes.<br>A team's win probability in each simulated game is calculated with the following equation: <br><br>Pr(win) = 0.5 + 2.032*(OBP<sub>team</sub> - OBP<sub>opponent</sub>) + 0.9*(SLG<sub>team</sub> - SLG<sub>opponent</sub>)</h3><div id='order'></div>";

  teamwins = [];
  for (team=0; team<order.length; team++) {
    teamwins.push(0);
  }
  for (team=0; team<order.length; team++) {
    for (opponent=team+1; opponent<order.length; opponent++) {
      results = simulateGames(team+1, opponent+1, 10);
      teamwins[team]+=results[0];
      teamwins[opponent]+=results[1];
    }
  }
  teamlosses = []
  for (team=0; team<order.length; team++) {
    teamlosses[team] = (order.length-1)*10 - teamwins[team];
  }

  var table = [];

  for (i=0; i<order.length; i++) {
    table.push([i+1, teamwins[i], teamlosses[i], (teamwins[i]/((order.length-1)*10)).toPrecision(3)]);
  }

  var tableString = "";
  for (i=0; i<table.length; i++) {
    tableString += "<tr id=team" + table[i][0] + ">";
    tableString += "<td>" +  table[i][0] + "</td>";
    tableString += "<td id=wins" + table[i][0] + ">" +  table[i][1] + "</td>";
    tableString += "<td id=losses" + table[i][0] + ">" +  table[i][2] + "</td>";
    tableString += "<td id=winpct" + table[i][0] + ">" +  table[i][3] + "</td>";
    tableString += "</tr>";
  }

  tableString = '<table class="table"><thead><tr><th>Team Number</th><th>Wins</th><th>Losses</th><th>Win Percentage</th></tr></thead><tbody>' + tableString + '</tbody></table>'

  seasonButton = "<br><br><div class='control'><button type='submit' class='button is-primary' onclick='simulatePlayoffs()'>Simulate Playoffs</button></div>";

  document.getElementById('order').innerHTML = tableString + seasonButton;
}

function simulateGames(team1, team2, n) {
  win1 = 0.5 - 2.032*(d3.mean(stats[team1]['obp']) - d3.mean(stats[team2]['obp'])) - 0.9*(d3.mean(stats[team1]['slg']) - d3.mean(stats[team2]['slg']));
  winloss1 = [0,0];
  for (i=0; i<n; i++) {
    if (d3.randomUniform(0,1)()>=win1) {
      winloss1[0]+=1;
    } else {
      winloss1[1]+=1;
    }
  }
  return winloss1;
}

function simulatePlayoffs() {
  round = 0;
  ranks = sortTeams();
  if (order.length==2) {
    playoff2();
  } else if (order.length==3){
    playoff3();
  } else if (order.length==4){
    playoff4();
  } else if (order.length==5){
    playoff5();
  } else if (order.length==6){
    playoff6();
  } else if (order.length==7){
    playoff7();
  } else if (order.length==8){
    playoff8();
  } else if (order.length==9){
    playoff9();
  } else {
    playoff10();

  }

// document.getElementById('app').innerHTML ='<h1 class="title">The Results of the Tournament</h1><div class="tournament-container"><div class="tournament-headers"><h3>Round of 16</h3>    <h3>Quarter-Finals</h3><h3>Semi-Finals</h3><h3>Final</h3><h3>Winner</h3></div><div class="tournament-brackets"><ul class="bracket bracket-1"><li class="team-item">A2 <time>14:00</time> C2</li>      <li class="team-item">D1 <time>20:00</time> 3BEF</li>      <li class="team-item">B1 <time>17:00</time> 3ACD</li>      <li class="team-item">F1 <time>20:00</time> E2</li>      <li class="team-item">C1 <time>17:00</time> 3ABF</li>      <li class="team-item">E1 <time>17:00</time> D2</li>      <li class="team-item">A1 <time>14:00</time> 3CDE</li>      <li class="team-item">B2 <time>20:00</time> F2</li>    </ul>     <ul class="bracket bracket-2">      <li class="team-item">QF1 <time>20:00</time> QF2</li>      <li class="team-item">QF3 <time>20:00</time> QF4</li>      <li class="team-item">QF5 <time>20:00</time> QF6</li>      <li class="team-item">QF7 <time>20:00</time> QF8</li>    </ul>      <ul class="bracket bracket-3">      <li class="team-item">SF1 <time>20:00</time> SF2</li>      <li class="team-item">SF3 <time>20:00</time> SF4</li>    </ul>      <ul class="bracket bracket-4">      <li class="team-item">F1 <time>20:00</time> F2</li>    </ul>      <ul class="bracket bracket-5">      <li class="team-item">European Champions</li>    </ul>    </div></div>';
}

function playoff2 () {
  results = simulateGames(1,2,7);
  var winner;
  if (results[0]>results[1]) {
    winner = 'Team 1';
  } else {
    winner = 'Team 2';
  }

  document.getElementById('app').innerHTML ='<h1 class="title">The Results of the Tournament</h1><div class="tournament-container"><div class="tournament-headers"><h3>Final</h3><h3>Winner</h3></div> <div class="tournament-brackets"><ul class="bracket bracket-1">      <li class="team-item">Team 1 <time>' + results[0] + ' - ' + results[1] + '</time> Team 2 </li>    </ul>      <ul class="bracket bracket-2">      <li class="team-item">' + winner + '</li>    </ul>    </div></div><h1 class="title">' + winner + ' is the Champion!</h1>';
  
}

function sortTeams () {
  ranks = [];
  for (i=0; i<order.length; i++) {
    ranks.push([i+1, teamwins[i]]);
  }
  return ranks.sort((a,b) => b[1]-a[1]);
}

function playoff3 () {
  round+=1;
  
  if (round==1) {
    results = []
    // First Round
    results.push(simulateGames(ranks[1][0],ranks[2][0],7));
    if (results[0][0]>results[0][1]) {
      winner.push(ranks[1][0]);
    } else {
      winner.push(ranks[2][0]);
    }
    // Second Round
    results.push(simulateGames(ranks[0][0],winner[0],7));
    if (results[1][0]>results[1][1]) {
      winner.push(ranks[0][0]);
    } else {
      winner.push(winner[0]);
    }
    document.getElementById('app').innerHTML ='<h1 class="title">The Results of the Tournament</h1><div class="tournament-container"><div class="tournament-headers"><h3>Semi-Final</h3><h3>Final</h3></div> <div class="tournament-brackets"><ul class="bracket bracket-1">      <li class="team-item">Team ' + ranks[1][0] + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + ranks[2][0] + ' </li> <li class="team-item">Team ' + ranks[0][0] + '</li> </ul>      <ul class="bracket bracket-2">      <li class="team-item">Team ' + ranks[0][0] + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + '?' + ' </li>    </ul>    </div></div><br><br><div class="control"><button type="submit" class="button is-primary" onclick="playoff3()">Simulate Round</button></div>';
  } else if (round==2) {
    
    document.getElementById('app').innerHTML ='<h1 class="title">The Results of the Tournament</h1><div class="tournament-container"><div class="tournament-headers"><h3>Semi-Final</h3><h3>Final</h3></div> <div class="tournament-brackets"><ul class="bracket bracket-1">      <li class="team-item">Team ' + ranks[1][0] + ' <time>' + results[0][0] + ' - ' + results[0][1] + '</time> Team ' + ranks[2][0] + ' </li> <li class="team-item">Team ' + ranks[0][0] + '</li> </ul>      <ul class="bracket bracket-2">      <li class="team-item">Team ' + ranks[0][0] + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + winner[0] + ' </li>    </ul>    </div></div><br><br><div class="control"><button type="submit" class="button is-primary" onclick="playoff3()">Simulate Round</button></div>';
  } else {
    document.getElementById('app').innerHTML ='<h1 class="title">The Results of the Tournament</h1><div class="tournament-container"><div class="tournament-headers"><h3>Semi-Final</h3><h3>Final</h3></div> <div class="tournament-brackets"><ul class="bracket bracket-1">      <li class="team-item">Team ' + ranks[1][0] + ' <time>' + results[0][0] + ' - ' + results[0][1] + '</time> Team ' + ranks[2][0] + ' </li> <li class="team-item">Team ' + ranks[0][0] + '</li> </ul>      <ul class="bracket bracket-2">      <li class="team-item">Team ' + ranks[0][0] + ' <time>' + results[1][0] + ' - ' + results[1][1] + '</time> Team ' + winner[0] + ' </li>    </ul>    </div></div><h1 class="title"> Team ' + winner[1] + ' is the Champion!</h1>';
    confetti.start(10000);

  }

  
}

function playoff4 () {
  round+=1;
  
  if (round==1) {
    results = []
    // First Round
    results.push(simulateGames(ranks[1][0],ranks[2][0],7));
    if (results[0][0]>results[0][1]) {
      winner.push(ranks[1][0]);
    } else {
      winner.push(ranks[2][0]);
    }
    results.push(simulateGames(ranks[0][0],ranks[3][0],7));
    if (results[1][0]>results[1][1]) {
      winner.push(ranks[0][0]);
    } else {
      winner.push(ranks[3][0]);
    }
    // Second Round
    results.push(simulateGames(winner[1],winner[0],7));
    if (results[2][0]>results[2][1]) {
      winner.push(winner[1]);
    } else {
      winner.push(winner[0]);
    }
    document.getElementById('app').innerHTML ='<h1 class="title">The Results of the Tournament</h1><div class="tournament-container"><div class="tournament-headers"><h3>Semi-Final</h3><h3>Final</h3></div> <div class="tournament-brackets"><ul class="bracket bracket-1">      <li class="team-item">Team ' + ranks[1][0] + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + ranks[2][0] + ' </li>  <li class="team-item">Team ' + ranks[0][0] + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + ranks[3][0] + ' </li> </ul>      <ul class="bracket bracket-2">      <li class="team-item">Team ' + '?' + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + '?' + ' </li>    </ul>    </div></div><br><br><div class="control"><button type="submit" class="button is-primary" onclick="playoff4()">Simulate Round</button></div>';
  } else if (round==2) {
    
    document.getElementById('app').innerHTML ='<h1 class="title">The Results of the Tournament</h1><div class="tournament-container"><div class="tournament-headers"><h3>Semi-Final</h3><h3>Final</h3></div> <div class="tournament-brackets"><ul class="bracket bracket-1">      <li class="team-item">Team ' + ranks[1][0] + ' <time>' + results[0][0] + ' - ' + results[0][1] + '</time> Team ' + ranks[2][0] + ' </li>  <li class="team-item">Team ' + ranks[0][0] + ' <time>' + results[1][0] + ' - ' + results[1][1] + '</time> Team ' + ranks[3][0] + ' </li> </ul>      <ul class="bracket bracket-2">      <li class="team-item">Team ' + winner[1] + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + winner[0] + ' </li>    </ul>    </div></div><br><br><div class="control"><button type="submit" class="button is-primary" onclick="playoff4()">Simulate Round</button></div>';
  } else {
    document.getElementById('app').innerHTML ='<h1 class="title">The Results of the Tournament</h1><div class="tournament-container"><div class="tournament-headers"><h3>Semi-Final</h3><h3>Final</h3></div> <div class="tournament-brackets"><ul class="bracket bracket-1">      <li class="team-item">Team ' + ranks[1][0] + ' <time>' + results[0][0] + ' - ' + results[0][1] + '</time> Team ' + ranks[2][0] + ' </li>  <li class="team-item">Team ' + ranks[0][0] + ' <time>' + results[1][0] + ' - ' + results[1][1] + '</time> Team ' + ranks[3][0] + ' </li> </ul>      <ul class="bracket bracket-2">      <li class="team-item">Team ' + winner[1] + ' <time>' + results[2][0] + ' - ' + results[2][1] + '</time> Team ' + winner[0] + ' </li>    </ul>    </div></div><h1 class="title"> Team ' + winner[2] + ' is the Champion!</h1>';
    confetti.start(10000);
  }
    
  
}

function playoff5 () {
  round+=1;
  
  if (round==1) {
    results = []
     // Play-in Round
     results.push(simulateGames(ranks[3][0],ranks[4][0],7));
     if (results[0][0]>results[0][1]) {
       winner.push(ranks[3][0]);
     } else {
       winner.push(ranks[4][0]);
     }
    // First Round
    results.push(simulateGames(ranks[1][0],ranks[2][0],7));
    if (results[1][0]>results[1][1]) {
      winner.push(ranks[1][0]);
    } else {
      winner.push(ranks[2][0]);
    }
    results.push(simulateGames(ranks[0][0],winner[0],7));
    if (results[2][0]>results[2][1]) {
      winner.push(ranks[0][0]);
    } else {
      winner.push(winner[0]);
    }
    // Second Round
    results.push(simulateGames(winner[2],winner[1],7));
    if (results[3][0]>results[3][1]) {
      winner.push(winner[2]);
    } else {
      winner.push(winner[1]);
    }
    document.getElementById('app').innerHTML ='<h1 class="title">The Results of the Tournament</h1><div class="tournament-container"><div class="tournament-headers"><h3>Wild-Card</h3><h3>Semi-Final</h3><h3>Final</h3></div> <div class="tournament-brackets"><ul class="bracket bracket-1">      <li class="team-item">Team ' + ranks[3][0] + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + ranks[4][0] + ' </li>  <li class="team-item">Team ' + ranks[0][0] + '</li> <li class="team-item">Team ' + ranks[2][0] + '</li> <li class="team-item">Team ' + ranks[1][0] + '</li> </ul> <ul class="bracket bracket-2">      <li class="team-item">Team ' + '?' + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + ranks[0][0] + ' </li>  <li class="team-item">Team ' + ranks[1][0] + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + ranks[2][0] + ' </li> </ul>      <ul class="bracket bracket-3">      <li class="team-item">Team ' + '?' + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + '?' + ' </li>    </ul>    </div></div><br><br><div class="control"><button type="submit" class="button is-primary" onclick="playoff5()">Simulate Round</button></div>';
  } else if (round==2) {
    
    document.getElementById('app').innerHTML ='<h1 class="title">The Results of the Tournament</h1><div class="tournament-container"><div class="tournament-headers"><h3>Wild-Card</h3><h3>Semi-Final</h3><h3>Final</h3></div> <div class="tournament-brackets"><ul class="bracket bracket-1">      <li class="team-item">Team ' + ranks[3][0] + ' <time>' + results[0][0] + ' - ' + results[0][1] + '</time> Team ' + ranks[4][0] + ' </li>  <li class="team-item">Team ' + ranks[0][0] + '</li> <li class="team-item">Team ' + ranks[2][0] + '</li> <li class="team-item">Team ' + ranks[1][0] + '</li> </ul> <ul class="bracket bracket-2">      <li class="team-item">Team ' + winner[0] + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + ranks[0][0] + ' </li>  <li class="team-item">Team ' + ranks[1][0] + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + ranks[2][0] + ' </li> </ul>      <ul class="bracket bracket-3">      <li class="team-item">Team ' + '?' + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + '?' + ' </li>    </ul>    </div></div><br><br><div class="control"><button type="submit" class="button is-primary" onclick="playoff5()">Simulate Round</button></div>';
  } else if (round==3) {
    
    document.getElementById('app').innerHTML ='<h1 class="title">The Results of the Tournament</h1><div class="tournament-container"><div class="tournament-headers"><h3>Wild-Card</h3><h3>Semi-Final</h3><h3>Final</h3></div> <div class="tournament-brackets"><ul class="bracket bracket-1">      <li class="team-item">Team ' + ranks[3][0] + ' <time>' + results[0][0] + ' - ' + results[0][1] + '</time> Team ' + ranks[4][0] + ' </li>  <li class="team-item">Team ' + ranks[0][0] + '</li> <li class="team-item">Team ' + ranks[2][0] + '</li> <li class="team-item">Team ' + ranks[1][0] + '</li> </ul> <ul class="bracket bracket-2">      <li class="team-item">Team ' + winner[0] + ' <time>' + results[2][1] + ' - ' + results[2][0] + '</time> Team ' + ranks[0][0] + ' </li>  <li class="team-item">Team ' + ranks[1][0] + ' <time>' + results[1][0] + ' - ' + results[1][1] + '</time> Team ' + ranks[2][0] + ' </li> </ul>      <ul class="bracket bracket-3">      <li class="team-item">Team ' + winner[1] + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + winner[2] + ' </li>    </ul>    </div></div><br><br><div class="control"><button type="submit" class="button is-primary" onclick="playoff5()">Simulate Round</button></div>';
  } else {
    document.getElementById('app').innerHTML ='<h1 class="title">The Results of the Tournament</h1><div class="tournament-container"><div class="tournament-headers"><h3>Wild-Card</h3><h3>Semi-Final</h3><h3>Final</h3></div> <div class="tournament-brackets"><ul class="bracket bracket-1">      <li class="team-item">Team ' + ranks[3][0] + ' <time>' + results[0][0] + ' - ' + results[0][1] + '</time> Team ' + ranks[4][0] + ' </li>  <li class="team-item">Team ' + ranks[0][0] + '</li> <li class="team-item">Team ' + ranks[2][0] + '</li> <li class="team-item">Team ' + ranks[1][0] + '</li> </ul> <ul class="bracket bracket-2">      <li class="team-item">Team ' + winner[0] + ' <time>' + results[2][1] + ' - ' + results[2][0] + '</time> Team ' + ranks[0][0] + ' </li>  <li class="team-item">Team ' + ranks[1][0] + ' <time>' + results[1][0] + ' - ' + results[1][1] + '</time> Team ' + ranks[2][0] + ' </li> </ul>      <ul class="bracket bracket-3">      <li class="team-item">Team ' + winner[1] + ' <time>' + results[3][1] + ' - ' + results[3][0] + '</time> Team ' + winner[2] + ' </li>    </ul>    </div></div><h1 class="title"> Team ' + winner[3] + ' is the Champion!</h1>';
    confetti.start(10000);
  }
}

function playoff6 () {
  round+=1;
  
  if (round==1) {
    results = []
     // Play-in Round
     results.push(simulateGames(ranks[2][0],ranks[5][0],7));
     if (results[0][0]>results[0][1]) {
       winner.push(ranks[2][0]);
     } else {
       winner.push(ranks[5][0]);
     }
     // Play-in Round
     results.push(simulateGames(ranks[3][0],ranks[4][0],7));
     if (results[1][0]>results[1][1]) {
       winner.push(ranks[3][0]);
     } else {
       winner.push(ranks[4][0]);
     }
    // First Round
    results.push(simulateGames(ranks[1][0],winner[0],7));
    if (results[2][0]>results[2][1]) {
      winner.push(ranks[1][0]);
    } else {
      winner.push(winner[0]);
    }
    results.push(simulateGames(ranks[0][0],winner[1],7));
    if (results[3][0]>results[3][1]) {
      winner.push(ranks[0][0]);
    } else {
      winner.push(winner[1]);
    }
    // Second Round
    results.push(simulateGames(winner[2],winner[3],7));
    if (results[4][0]>results[4][1]) {
      winner.push(winner[2]);
    } else {
      winner.push(winner[3]);
    }
    document.getElementById('app').innerHTML ='<h1 class="title">The Results of the Tournament</h1><div class="tournament-container"><div class="tournament-headers"><h3>Wild-Card</h3><h3>Semi-Final</h3><h3>Final</h3></div> <div class="tournament-brackets"><ul class="bracket bracket-1">      <li class="team-item">Team ' + ranks[3][0] + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + ranks[4][0] + ' </li>  <li class="team-item">Team ' + ranks[0][0] + '</li> <li class="team-item">Team ' + ranks[1][0] + '</li>  <li class="team-item">Team ' + ranks[2][0] + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + ranks[5][0] + ' </li> </ul> <ul class="bracket bracket-2">      <li class="team-item">Team ' + '?' + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + ranks[0][0] + ' </li>  <li class="team-item">Team ' + ranks[1][0] + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + '?' + ' </li> </ul>      <ul class="bracket bracket-3">      <li class="team-item">Team ' + '?' + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + '?' + ' </li>    </ul>    </div></div><br><br><div class="control"><button type="submit" class="button is-primary" onclick="playoff6()">Simulate Round</button></div>';
  } else if (round==2) {
    
    document.getElementById('app').innerHTML ='<h1 class="title">The Results of the Tournament</h1><div class="tournament-container"><div class="tournament-headers"><h3>Wild-Card</h3><h3>Semi-Final</h3><h3>Final</h3></div> <div class="tournament-brackets"><ul class="bracket bracket-1">      <li class="team-item">Team ' + ranks[3][0] + ' <time>' + results[1][0] + ' - ' + results[1][1] + '</time> Team ' + ranks[4][0] + ' </li>  <li class="team-item">Team ' + ranks[0][0] + '</li> <li class="team-item">Team ' + ranks[1][0] + '</li>  <li class="team-item">Team ' + ranks[2][0] + ' <time>' + results[0][0] + ' - ' + results[0][1] + '</time> Team ' + ranks[5][0] + ' </li> </ul> <ul class="bracket bracket-2">      <li class="team-item">Team ' + winner[1] + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + ranks[0][0] + ' </li>  <li class="team-item">Team ' + ranks[1][0] + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + winner[0] + ' </li> </ul>      <ul class="bracket bracket-3">      <li class="team-item">Team ' + '?' + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + '?' + ' </li>    </ul>    </div></div><br><br><div class="control"><button type="submit" class="button is-primary" onclick="playoff6()">Simulate Round</button></div>';
  } else if (round==3) {
    
    document.getElementById('app').innerHTML ='<h1 class="title">The Results of the Tournament</h1><div class="tournament-container"><div class="tournament-headers"><h3>Wild-Card</h3><h3>Semi-Final</h3><h3>Final</h3></div> <div class="tournament-brackets"><ul class="bracket bracket-1">      <li class="team-item">Team ' + ranks[3][0] + ' <time>' + results[1][0] + ' - ' + results[1][1] + '</time> Team ' + ranks[4][0] + ' </li>  <li class="team-item">Team ' + ranks[0][0] + '</li> <li class="team-item">Team ' + ranks[1][0] + '</li>  <li class="team-item">Team ' + ranks[2][0] + ' <time>' + results[0][0] + ' - ' + results[0][1] + '</time> Team ' + ranks[5][0] + ' </li> </ul> <ul class="bracket bracket-2">      <li class="team-item">Team ' + winner[1] + ' <time>' + results[3][1] + ' - ' + results[3][0] + '</time> Team ' + ranks[0][0] + ' </li>  <li class="team-item">Team ' + ranks[1][0] + ' <time>' + results[2][0] + ' - ' + results[2][1] + '</time> Team ' + winner[0] + ' </li> </ul>      <ul class="bracket bracket-3">      <li class="team-item">Team ' + winner[3] + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + winner[2] + ' </li>    </ul>    </div></div><br><br><div class="control"><button type="submit" class="button is-primary" onclick="playoff6()">Simulate Round</button></div>';
  } else {
    document.getElementById('app').innerHTML ='<h1 class="title">The Results of the Tournament</h1><div class="tournament-container"><div class="tournament-headers"><h3>Wild-Card</h3><h3>Semi-Final</h3><h3>Final</h3></div> <div class="tournament-brackets"><ul class="bracket bracket-1">      <li class="team-item">Team ' + ranks[3][0] + ' <time>' + results[1][0] + ' - ' + results[1][1] + '</time> Team ' + ranks[4][0] + ' </li>  <li class="team-item">Team ' + ranks[0][0] + '</li> <li class="team-item">Team ' + ranks[1][0] + '</li>  <li class="team-item">Team ' + ranks[2][0] + ' <time>' + results[0][0] + ' - ' + results[0][1] + '</time> Team ' + ranks[5][0] + ' </li> </ul> <ul class="bracket bracket-2">      <li class="team-item">Team ' + winner[1] + ' <time>' + results[3][1] + ' - ' + results[3][0] + '</time> Team ' + ranks[0][0] + ' </li>  <li class="team-item">Team ' + ranks[1][0] + ' <time>' + results[2][0] + ' - ' + results[2][1] + '</time> Team ' + winner[0] + ' </li> </ul>      <ul class="bracket bracket-3">      <li class="team-item">Team ' + winner[3] + ' <time>' + results[4][1] + ' - ' + results[4][0] + '</time> Team ' + winner[2] + ' </li>    </ul>    </div></div><h1 class="title"> Team ' + winner[4] + ' is the Champion!</h1>';
    confetti.start(10000);
  }
}

function playoff7 () {
  round+=1;
  
  if (round==1) {
    results = []
     // Play-in Round
     results.push(simulateGames(ranks[1][0],ranks[6][0],7));
     if (results[0][0]>results[0][1]) {
       winner.push(ranks[1][0]);
     } else {
       winner.push(ranks[6][0]);
     }
     results.push(simulateGames(ranks[2][0],ranks[5][0],7));
     if (results[1][0]>results[1][1]) {
       winner.push(ranks[2][0]);
     } else {
       winner.push(ranks[5][0]);
     }
     results.push(simulateGames(ranks[3][0],ranks[4][0],7));
     if (results[2][0]>results[2][1]) {
       winner.push(ranks[3][0]);
     } else {
       winner.push(ranks[4][0]);
     }
    // First Round
    results.push(simulateGames(winner[2],ranks[0][0],7));
    if (results[3][0]>results[3][1]) {
      winner.push(winner[2]);
    } else {
      winner.push(ranks[0][0]);
    }
    results.push(simulateGames(winner[0],winner[1],7));
    if (results[4][0]>results[4][1]) {
      winner.push(winner[0]);
    } else {
      winner.push(winner[1]);
    }
    // Second Round
    results.push(simulateGames(winner[4],winner[3],7));
    if (results[5][0]>results[5][1]) {
      winner.push(winner[4]);
    } else {
      winner.push(winner[3]);
    }
    document.getElementById('app').innerHTML ='<h1 class="title">The Results of the Tournament</h1><div class="tournament-container"><div class="tournament-headers"><h3>Wild-Card</h3><h3>Semi-Final</h3><h3>Final</h3></div> <div class="tournament-brackets"><ul class="bracket bracket-1">      <li class="team-item">Team ' + ranks[3][0] + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + ranks[4][0] + ' </li>  <li class="team-item">Team ' + ranks[0][0] + '</li>  <li class="team-item">Team ' + ranks[6][0] + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + ranks[1][0] + ' </li>   <li class="team-item">Team ' + ranks[2][0] + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + ranks[5][0] + ' </li> </ul> <ul class="bracket bracket-2">      <li class="team-item">Team ' + '?' + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + ranks[0][0] + ' </li>  <li class="team-item">Team ' + '?' + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + '?' + ' </li> </ul>      <ul class="bracket bracket-3">      <li class="team-item">Team ' + '?' + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + '?' + ' </li>    </ul>    </div></div><br><br><div class="control"><button type="submit" class="button is-primary" onclick="playoff7()">Simulate Round</button></div>';
  } else if (round==2) {
    
    document.getElementById('app').innerHTML ='<h1 class="title">The Results of the Tournament</h1><div class="tournament-container"><div class="tournament-headers"><h3>Wild-Card</h3><h3>Semi-Final</h3><h3>Final</h3></div> <div class="tournament-brackets"><ul class="bracket bracket-1">      <li class="team-item">Team ' + ranks[3][0] + ' <time>' + results[2][0] + ' - ' + results[2][1] + '</time> Team ' + ranks[4][0] + ' </li>  <li class="team-item">Team ' + ranks[0][0] + '</li>  <li class="team-item">Team ' + ranks[6][0] + ' <time>' + results[0][1] + ' - ' + results[0][0] + '</time> Team ' + ranks[1][0] + ' </li>   <li class="team-item">Team ' + ranks[2][0] + ' <time>' + results[1][0] + ' - ' + results[1][1] + '</time> Team ' + ranks[5][0] + ' </li> </ul> <ul class="bracket bracket-2">      <li class="team-item">Team ' + winner[2] + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + ranks[0][0] + ' </li>  <li class="team-item">Team ' + winner[0] + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + winner[1] + ' </li> </ul>      <ul class="bracket bracket-3">      <li class="team-item">Team ' + '?' + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + '?' + ' </li>    </ul>    </div></div><br><br><div class="control"><button type="submit" class="button is-primary" onclick="playoff7()">Simulate Round</button></div>';
  } else if (round==3) {
    
    document.getElementById('app').innerHTML ='<h1 class="title">The Results of the Tournament</h1><div class="tournament-container"><div class="tournament-headers"><h3>Wild-Card</h3><h3>Semi-Final</h3><h3>Final</h3></div> <div class="tournament-brackets"><ul class="bracket bracket-1">      <li class="team-item">Team ' + ranks[3][0] + ' <time>' + results[2][0] + ' - ' + results[2][1] + '</time> Team ' + ranks[4][0] + ' </li>  <li class="team-item">Team ' + ranks[0][0] + '</li>  <li class="team-item">Team ' + ranks[6][0] + ' <time>' + results[0][1] + ' - ' + results[0][0] + '</time> Team ' + ranks[1][0] + ' </li>   <li class="team-item">Team ' + ranks[2][0] + ' <time>' + results[1][0] + ' - ' + results[1][1] + '</time> Team ' + ranks[5][0] + ' </li> </ul> <ul class="bracket bracket-2">      <li class="team-item">Team ' + winner[2] + ' <time>' + results[3][0] + ' - ' + results[3][1] + '</time> Team ' + ranks[0][0] + ' </li>  <li class="team-item">Team ' + winner[0] + ' <time>' + results[4][0] + ' - ' + results[4][1] + '</time> Team ' + winner[1] + ' </li> </ul>      <ul class="bracket bracket-3">      <li class="team-item">Team ' + winner[3] + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + winner[4] + ' </li>    </ul>    </div></div><br><br><div class="control"><button type="submit" class="button is-primary" onclick="playoff7()">Simulate Round</button></div>';
  } else {
    document.getElementById('app').innerHTML ='<h1 class="title">The Results of the Tournament</h1><div class="tournament-container"><div class="tournament-headers"><h3>Wild-Card</h3><h3>Semi-Final</h3><h3>Final</h3></div> <div class="tournament-brackets"><ul class="bracket bracket-1">      <li class="team-item">Team ' + ranks[3][0] + ' <time>' + results[2][0] + ' - ' + results[2][1] + '</time> Team ' + ranks[4][0] + ' </li>  <li class="team-item">Team ' + ranks[0][0] + '</li>  <li class="team-item">Team ' + ranks[6][0] + ' <time>' + results[0][1] + ' - ' + results[0][0] + '</time> Team ' + ranks[1][0] + ' </li>   <li class="team-item">Team ' + ranks[2][0] + ' <time>' + results[1][0] + ' - ' + results[1][1] + '</time> Team ' + ranks[5][0] + ' </li> </ul> <ul class="bracket bracket-2">      <li class="team-item">Team ' + winner[2] + ' <time>' + results[3][0] + ' - ' + results[3][1] + '</time> Team ' + ranks[0][0] + ' </li>  <li class="team-item">Team ' + winner[0] + ' <time>' + results[4][0] + ' - ' + results[4][1] + '</time> Team ' + winner[1] + ' </li> </ul>      <ul class="bracket bracket-3">      <li class="team-item">Team ' + winner[3] + ' <time>' + results[5][1] + ' - ' + results[5][0] + '</time> Team ' + winner[4] + ' </li>    </ul>    </div></div><h1 class="title"> Team ' + winner[5] + ' is the Champion!</h1>';
    confetti.start(10000);
  }
}

function playoff8 () {
  round+=1;
  
  if (round==1) {
    results = []
     // Quarter-Finals
     results.push(simulateGames(ranks[1][0],ranks[6][0],7));
     if (results[0][0]>results[0][1]) {
       winner.push(ranks[1][0]);
     } else {
       winner.push(ranks[6][0]);
     }
     results.push(simulateGames(ranks[2][0],ranks[5][0],7));
     if (results[1][0]>results[1][1]) {
       winner.push(ranks[2][0]);
     } else {
       winner.push(ranks[5][0]);
     }
     results.push(simulateGames(ranks[3][0],ranks[4][0],7));
     if (results[2][0]>results[2][1]) {
       winner.push(ranks[3][0]);
     } else {
       winner.push(ranks[4][0]);
     }
     results.push(simulateGames(ranks[0][0],ranks[7][0],7));
     if (results[3][0]>results[3][1]) {
       winner.push(ranks[0][0]);
     } else {
       winner.push(ranks[7][0]);
     }
    // Semi-Finals
    results.push(simulateGames(winner[2],winner[3],7));
    if (results[4][0]>results[4][1]) {
      winner.push(winner[2]);
    } else {
      winner.push(winner[3]);
    }
    results.push(simulateGames(winner[0],winner[1],7));
    if (results[5][0]>results[5][1]) {
      winner.push(winner[0]);
    } else {
      winner.push(winner[1]);
    }
    // Final
    results.push(simulateGames(winner[4],winner[5],7));
    if (results[6][0]>results[6][1]) {
      winner.push(winner[4]);
    } else {
      winner.push(winner[3]);
    }
    document.getElementById('app').innerHTML ='<h1 class="title">The Results of the Tournament</h1><div class="tournament-container"><div class="tournament-headers"><h3>Quarter-Finals</h3><h3>Semi-Final</h3><h3>Final</h3></div> <div class="tournament-brackets"><ul class="bracket bracket-1">      <li class="team-item">Team ' + ranks[3][0] + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + ranks[4][0] + ' </li>  <li class="team-item">Team ' + ranks[0][0] + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + ranks[7][0] + ' </li>  <li class="team-item">Team ' + ranks[6][0] + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + ranks[1][0] + ' </li>   <li class="team-item">Team ' + ranks[2][0] + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + ranks[5][0] + ' </li> </ul> <ul class="bracket bracket-2">      <li class="team-item">Team ' + '?' + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + '?' + ' </li>  <li class="team-item">Team ' + '?' + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + '?' + ' </li> </ul>      <ul class="bracket bracket-3">      <li class="team-item">Team ' + '?' + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + '?' + ' </li>    </ul>    </div></div><br><br><div class="control"><button type="submit" class="button is-primary" onclick="playoff8()">Simulate Round</button></div>';
  } else if (round==2) {
    
    document.getElementById('app').innerHTML ='<h1 class="title">The Results of the Tournament</h1><div class="tournament-container"><div class="tournament-headers"><h3>Quarter-Finals</h3><h3>Semi-Final</h3><h3>Final</h3></div> <div class="tournament-brackets"><ul class="bracket bracket-1">      <li class="team-item">Team ' + ranks[3][0] + ' <time>' + results[2][0] + ' - ' + results[2][1] + '</time> Team ' + ranks[4][0] + ' </li>  <li class="team-item">Team ' + ranks[0][0] + ' <time>' + results[3][0] + ' - ' + results[3][1] + '</time> Team ' + ranks[7][0] + ' </li>  <li class="team-item">Team ' + ranks[6][0] + ' <time>' + results[0][1] + ' - ' + results[0][0] + '</time> Team ' + ranks[1][0] + ' </li>   <li class="team-item">Team ' + ranks[2][0] + ' <time>' + results[1][0] + ' - ' + results[1][1] + '</time> Team ' + ranks[5][0] + ' </li> </ul> <ul class="bracket bracket-2">      <li class="team-item">Team ' + winner[2] + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + winner[3] + ' </li>  <li class="team-item">Team ' + winner[0] + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + winner[1] + ' </li> </ul>      <ul class="bracket bracket-3">      <li class="team-item">Team ' + '?' + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + '?' + ' </li>    </ul>    </div></div><br><br><div class="control"><button type="submit" class="button is-primary" onclick="playoff8()">Simulate Round</button></div>';
  } else if (round==3) {
    
    document.getElementById('app').innerHTML ='<h1 class="title">The Results of the Tournament</h1><div class="tournament-container"><div class="tournament-headers"><h3>Quarter-Finals</h3><h3>Semi-Final</h3><h3>Final</h3></div> <div class="tournament-brackets"><ul class="bracket bracket-1">      <li class="team-item">Team ' + ranks[3][0] + ' <time>' + results[2][0] + ' - ' + results[2][1] + '</time> Team ' + ranks[4][0] + ' </li>  <li class="team-item">Team ' + ranks[0][0] + ' <time>' + results[3][0] + ' - ' + results[3][1] + '</time> Team ' + ranks[7][0] + ' </li>  <li class="team-item">Team ' + ranks[6][0] + ' <time>' + results[0][1] + ' - ' + results[0][0] + '</time> Team ' + ranks[1][0] + ' </li>   <li class="team-item">Team ' + ranks[2][0] + ' <time>' + results[1][0] + ' - ' + results[1][1] + '</time> Team ' + ranks[5][0] + ' </li> </ul> <ul class="bracket bracket-2">      <li class="team-item">Team ' + winner[2] + ' <time>' + results[4][0] + ' - ' + results[4][1] + '</time> Team ' + winner[3] + ' </li>  <li class="team-item">Team ' + winner[0] + ' <time>' + results[5][0] + ' - ' + results[5][1] + '</time> Team ' + winner[1] + ' </li> </ul>      <ul class="bracket bracket-3">      <li class="team-item">Team ' + winner[4] + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + winner[5] + ' </li>    </ul>    </div></div><br><br><div class="control"><button type="submit" class="button is-primary" onclick="playoff8()">Simulate Round</button></div>';
  } else {
    document.getElementById('app').innerHTML ='<h1 class="title">The Results of the Tournament</h1><div class="tournament-container"><div class="tournament-headers"><h3>Quarter-Finals</h3><h3>Semi-Final</h3><h3>Final</h3></div> <div class="tournament-brackets"><ul class="bracket bracket-1">      <li class="team-item">Team ' + ranks[3][0] + ' <time>' + results[2][0] + ' - ' + results[2][1] + '</time> Team ' + ranks[4][0] + ' </li>  <li class="team-item">Team ' + ranks[0][0] + ' <time>' + results[3][0] + ' - ' + results[3][1] + '</time> Team ' + ranks[7][0] + ' </li>  <li class="team-item">Team ' + ranks[6][0] + ' <time>' + results[0][1] + ' - ' + results[0][0] + '</time> Team ' + ranks[1][0] + ' </li>   <li class="team-item">Team ' + ranks[2][0] + ' <time>' + results[1][0] + ' - ' + results[1][1] + '</time> Team ' + ranks[5][0] + ' </li> </ul> <ul class="bracket bracket-2">      <li class="team-item">Team ' + winner[2] + ' <time>' + results[4][0] + ' - ' + results[4][1] + '</time> Team ' + winner[3] + ' </li>  <li class="team-item">Team ' + winner[0] + ' <time>' + results[5][0] + ' - ' + results[5][1] + '</time> Team ' + winner[1] + ' </li> </ul>      <ul class="bracket bracket-3">      <li class="team-item">Team ' + winner[4] + ' <time>' + results[6][0] + ' - ' + results[6][1] + '</time> Team ' + winner[5] + ' </li>    </ul>    </div></div><h1 class="title"> Team ' + winner[6] + ' is the Champion!</h1>';
    confetti.start(10000);
  }
}

function playoff9 () {
  round+=1;
  
  if (round==1) {
    results = []
     // Wild Card
     results.push(simulateGames(ranks[7][0],ranks[8][0],7));
     if (results[0][0]>results[0][1]) {
       winner.push(ranks[7][0]);
     } else {
       winner.push(ranks[8][0]);
     }
     // Quarter-Finals
     results.push(simulateGames(ranks[1][0],ranks[6][0],7));
     if (results[1][0]>results[1][1]) {
       winner.push(ranks[1][0]);
     } else {
       winner.push(ranks[6][0]);
     }
     results.push(simulateGames(ranks[2][0],ranks[5][0],7));
     if (results[2][0]>results[2][1]) {
       winner.push(ranks[2][0]);
     } else {
       winner.push(ranks[5][0]);
     }
     results.push(simulateGames(ranks[3][0],ranks[4][0],7));
     if (results[3][0]>results[3][1]) {
       winner.push(ranks[3][0]);
     } else {
       winner.push(ranks[4][0]);
     }
     results.push(simulateGames(ranks[0][0],winner[0],7));
     if (results[4][0]>results[4][1]) {
       winner.push(ranks[0][0]);
     } else {
       winner.push(winner[0]);
     }
    // Semi-Finals
    results.push(simulateGames(winner[3],winner[4],7));
    if (results[5][0]>results[5][1]) {
      winner.push(winner[3]);
    } else {
      winner.push(winner[4]);
    }
    results.push(simulateGames(winner[1],winner[2],7));
    if (results[6][0]>results[6][1]) {
      winner.push(winner[1]);
    } else {
      winner.push(winner[2]);
    }
    // Final
    results.push(simulateGames(winner[5],winner[6],7));
    if (results[7][0]>results[7][1]) {
      winner.push(winner[5]);
    } else {
      winner.push(winner[6]);
    }
    document.getElementById('app').innerHTML ='<h1 class="title">The Results of the Tournament</h1><div class="tournament-container"><div class="tournament-headers"><h3>Wild Card</h3><h3>Quarter-Finals</h3><h3>Semi-Final</h3><h3>Final</h3></div> <div class="tournament-brackets"><ul class="bracket bracket-1">      <li class="team-item">Team ' + ranks[7][0] + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + ranks[8][0] + ' </li>  <li class="team-item">Team ' + ranks[0][0] + '</li><li class="team-item">Team ' + ranks[3][0] + '</li><li class="team-item">Team ' + ranks[4][0] + '</li><li class="team-item">Team ' + ranks[1][0] + '</li><li class="team-item">Team ' + ranks[6][0] + '</li><li class="team-item">Team ' + ranks[2][0] + '</li><li class="team-item">Team ' + ranks[5][0] + '</li> </ul><ul class="bracket bracket-2">      <li class="team-item">Team ' + '?' + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + ranks[0][0] + ' </li>  <li class="team-item">Team ' + ranks[3][0] + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + ranks[4][0] + ' </li>  <li class="team-item">Team ' + ranks[1][0] + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + ranks[6][0] + ' </li>   <li class="team-item">Team ' + ranks[2][0] + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + ranks[5][0] + ' </li> </ul> <ul class="bracket bracket-3">      <li class="team-item">Team ' + '?' + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + '?' + ' </li>  <li class="team-item">Team ' + '?' + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + '?' + ' </li> </ul>      <ul class="bracket bracket-4">      <li class="team-item">Team ' + '?' + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + '?' + ' </li>    </ul>    </div></div><div class="control"><button type="submit" class="button is-primary" onclick="playoff9()">Simulate Round</button></div>';
  } else if (round==2) {
    
    document.getElementById('app').innerHTML ='<h1 class="title">The Results of the Tournament</h1><div class="tournament-container"><div class="tournament-headers"><h3>Wild Card</h3><h3>Quarter-Finals</h3><h3>Semi-Final</h3><h3>Final</h3></div> <div class="tournament-brackets"><ul class="bracket bracket-1">      <li class="team-item">Team ' + ranks[7][0] + ' <time>' + results[0][0] + ' - ' + results[0][1] + '</time> Team ' + ranks[8][0] + ' </li>  <li class="team-item">Team ' + ranks[0][0] + '</li><li class="team-item">Team ' + ranks[3][0] + '</li><li class="team-item">Team ' + ranks[4][0] + '</li><li class="team-item">Team ' + ranks[1][0] + '</li><li class="team-item">Team ' + ranks[6][0] + '</li><li class="team-item">Team ' + ranks[2][0] + '</li><li class="team-item">Team ' + ranks[5][0] + '</li> </ul><ul class="bracket bracket-2">      <li class="team-item">Team ' + winner[0] + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + ranks[0][0] + ' </li>  <li class="team-item">Team ' + ranks[3][0] + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + ranks[4][0] + ' </li>  <li class="team-item">Team ' + ranks[1][0] + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + ranks[6][0] + ' </li>   <li class="team-item">Team ' + ranks[2][0] + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + ranks[5][0] + ' </li> </ul> <ul class="bracket bracket-3">      <li class="team-item">Team ' + '?' + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + '?' + ' </li>  <li class="team-item">Team ' + '?' + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + '?' + ' </li> </ul>      <ul class="bracket bracket-4">      <li class="team-item">Team ' + '?' + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + '?' + ' </li>    </ul>    </div></div><div class="control"><button type="submit" class="button is-primary" onclick="playoff9()">Simulate Round</button></div>';
  } else if (round==3) {
    
    document.getElementById('app').innerHTML ='<h1 class="title">The Results of the Tournament</h1><div class="tournament-container"><div class="tournament-headers"><h3>Wild Card</h3><h3>Quarter-Finals</h3><h3>Semi-Final</h3><h3>Final</h3></div> <div class="tournament-brackets"><ul class="bracket bracket-1">      <li class="team-item">Team ' + ranks[7][0] + ' <time>' + results[0][0] + ' - ' + results[0][1] + '</time> Team ' + ranks[8][0] + ' </li>  <li class="team-item">Team ' + ranks[0][0] + '</li><li class="team-item">Team ' + ranks[3][0] + '</li><li class="team-item">Team ' + ranks[4][0] + '</li><li class="team-item">Team ' + ranks[1][0] + '</li><li class="team-item">Team ' + ranks[6][0] + '</li><li class="team-item">Team ' + ranks[2][0] + '</li><li class="team-item">Team ' + ranks[5][0] + '</li> </ul><ul class="bracket bracket-2">      <li class="team-item">Team ' + winner[0] + ' <time>' + results[4][1] + ' - ' + results[4][0] + '</time> Team ' + ranks[0][0] + ' </li>  <li class="team-item">Team ' + ranks[3][0] + ' <time>' + results[3][0] + ' - ' + results[3][1] + '</time> Team ' + ranks[4][0] + ' </li>  <li class="team-item">Team ' + ranks[1][0] + ' <time>' + results[1][0] + ' - ' + results[1][1] + '</time> Team ' + ranks[6][0] + ' </li>   <li class="team-item">Team ' + ranks[2][0] + ' <time>' + results[2][0] + ' - ' + results[2][1] + '</time> Team ' + ranks[5][0] + ' </li> </ul> <ul class="bracket bracket-3">      <li class="team-item">Team ' + winner[4] + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + winner[3] + ' </li>  <li class="team-item">Team ' + winner[1] + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + winner[2] + ' </li> </ul>      <ul class="bracket bracket-4">      <li class="team-item">Team ' + '?' + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + '?' + ' </li>    </ul>    </div></div><div class="control"><button type="submit" class="button is-primary" onclick="playoff9()">Simulate Round</button></div>';
  } else if (round==4) {
    
    document.getElementById('app').innerHTML ='<h1 class="title">The Results of the Tournament</h1><div class="tournament-container"><div class="tournament-headers"><h3>Wild Card</h3><h3>Quarter-Finals</h3><h3>Semi-Final</h3><h3>Final</h3></div> <div class="tournament-brackets"><ul class="bracket bracket-1">      <li class="team-item">Team ' + ranks[7][0] + ' <time>' + results[0][0] + ' - ' + results[0][1] + '</time> Team ' + ranks[8][0] + ' </li>  <li class="team-item">Team ' + ranks[0][0] + '</li><li class="team-item">Team ' + ranks[3][0] + '</li><li class="team-item">Team ' + ranks[4][0] + '</li><li class="team-item">Team ' + ranks[1][0] + '</li><li class="team-item">Team ' + ranks[6][0] + '</li><li class="team-item">Team ' + ranks[2][0] + '</li><li class="team-item">Team ' + ranks[5][0] + '</li> </ul><ul class="bracket bracket-2">      <li class="team-item">Team ' + winner[0] + ' <time>' + results[4][1] + ' - ' + results[4][0] + '</time> Team ' + ranks[0][0] + ' </li>  <li class="team-item">Team ' + ranks[3][0] + ' <time>' + results[3][0] + ' - ' + results[3][1] + '</time> Team ' + ranks[4][0] + ' </li>  <li class="team-item">Team ' + ranks[1][0] + ' <time>' + results[1][0] + ' - ' + results[1][1] + '</time> Team ' + ranks[6][0] + ' </li>   <li class="team-item">Team ' + ranks[2][0] + ' <time>' + results[2][0] + ' - ' + results[2][1] + '</time> Team ' + ranks[5][0] + ' </li> </ul> <ul class="bracket bracket-3">      <li class="team-item">Team ' + winner[4] + ' <time>' + results[5][1] + ' - ' + results[5][0] + '</time> Team ' + winner[3] + ' </li>  <li class="team-item">Team ' + winner[1] + ' <time>' + results[6][0] + ' - ' + results[6][1] + '</time> Team ' + winner[2] + ' </li> </ul>      <ul class="bracket bracket-4">      <li class="team-item">Team ' + winner[5] + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + winner[6] + ' </li>    </ul>    </div></div><div class="control"><button type="submit" class="button is-primary" onclick="playoff9()">Simulate Round</button></div>';
  } else {
    document.getElementById('app').innerHTML ='<h1 class="title">The Results of the Tournament</h1><div class="tournament-container"><div class="tournament-headers"><h3>Wild Card</h3><h3>Quarter-Finals</h3><h3>Semi-Final</h3><h3>Final</h3></div> <div class="tournament-brackets"><ul class="bracket bracket-1">      <li class="team-item">Team ' + ranks[7][0] + ' <time>' + results[0][0] + ' - ' + results[0][1] + '</time> Team ' + ranks[8][0] + ' </li>  <li class="team-item">Team ' + ranks[0][0] + '</li><li class="team-item">Team ' + ranks[3][0] + '</li><li class="team-item">Team ' + ranks[4][0] + '</li><li class="team-item">Team ' + ranks[1][0] + '</li><li class="team-item">Team ' + ranks[6][0] + '</li><li class="team-item">Team ' + ranks[2][0] + '</li><li class="team-item">Team ' + ranks[5][0] + '</li> </ul><ul class="bracket bracket-2">      <li class="team-item">Team ' + winner[0] + ' <time>' + results[4][1] + ' - ' + results[4][0] + '</time> Team ' + ranks[0][0] + ' </li>  <li class="team-item">Team ' + ranks[3][0] + ' <time>' + results[3][0] + ' - ' + results[3][1] + '</time> Team ' + ranks[4][0] + ' </li>  <li class="team-item">Team ' + ranks[1][0] + ' <time>' + results[1][0] + ' - ' + results[1][1] + '</time> Team ' + ranks[6][0] + ' </li>   <li class="team-item">Team ' + ranks[2][0] + ' <time>' + results[2][0] + ' - ' + results[2][1] + '</time> Team ' + ranks[5][0] + ' </li> </ul> <ul class="bracket bracket-3">      <li class="team-item">Team ' + winner[4] + ' <time>' + results[5][1] + ' - ' + results[5][0] + '</time> Team ' + winner[3] + ' </li>  <li class="team-item">Team ' + winner[1] + ' <time>' + results[6][0] + ' - ' + results[6][1] + '</time> Team ' + winner[2] + ' </li> </ul>      <ul class="bracket bracket-4">      <li class="team-item">Team ' + winner[5] + ' <time>' + results[7][0] + ' - ' + results[7][1] + '</time> Team ' + winner[6] + ' </li>    </ul>    </div></div><h1 class="title"> Team ' + winner[7] + ' is the Champion!</h1>';
    confetti.start(10000);
  }
}

function playoff10 () {
  round+=1;
  
  if (round==1) {
    results = []
     // Wild Card
     results.push(simulateGames(ranks[6][0],ranks[9][0],7));
     if (results[0][0]>results[0][1]) {
       winner.push(ranks[6][0]);
     } else {
       winner.push(ranks[9][0]);
     }
     results.push(simulateGames(ranks[7][0],ranks[8][0],7));
     if (results[1][0]>results[1][1]) {
       winner.push(ranks[7][0]);
     } else {
       winner.push(ranks[8][0]);
     }
     // Quarter-Finals
     results.push(simulateGames(ranks[1][0],winner[0],7));
     if (results[2][0]>results[2][1]) {
       winner.push(ranks[1][0]);
     } else {
       winner.push(winner[0]);
     }
     results.push(simulateGames(ranks[2][0],ranks[5][0],7));
     if (results[3][0]>results[3][1]) {
       winner.push(ranks[2][0]);
     } else {
       winner.push(ranks[5][0]);
     }
     results.push(simulateGames(ranks[3][0],ranks[4][0],7));
     if (results[4][0]>results[4][1]) {
       winner.push(ranks[3][0]);
     } else {
       winner.push(ranks[4][0]);
     }
     results.push(simulateGames(ranks[0][0],winner[1],7));
     if (results[5][0]>results[5][1]) {
       winner.push(ranks[0][0]);
     } else {
       winner.push(winner[1]);
     }
    // Semi-Finals
    results.push(simulateGames(winner[2],winner[3],7));
    if (results[6][0]>results[6][1]) {
      winner.push(winner[2]);
    } else {
      winner.push(winner[3]);
    }
    results.push(simulateGames(winner[4],winner[5],7));
    if (results[7][0]>results[7][1]) {
      winner.push(winner[4]);
    } else {
      winner.push(winner[5]);
    }
    // Final
    results.push(simulateGames(winner[6],winner[7],7));
    if (results[8][0]>results[8][1]) {
      winner.push(winner[6]);
    } else {
      winner.push(winner[7]);
    }
    document.getElementById('app').innerHTML ='<h1 class="title">The Results of the Tournament</h1><div class="tournament-container"><div class="tournament-headers"><h3>Wild Card</h3><h3>Quarter-Finals</h3><h3>Semi-Final</h3><h3>Final</h3></div> <div class="tournament-brackets"><ul class="bracket bracket-1">      <li class="team-item">Team ' + ranks[7][0] + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + ranks[8][0] + ' </li>  <li class="team-item">Team ' + ranks[0][0] + '</li><li class="team-item">Team ' + ranks[3][0] + '</li><li class="team-item">Team ' + ranks[4][0] + '</li><li class="team-item">Team ' + ranks[1][0] + '</li><li class="team-item">Team ' + ranks[6][0] + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + ranks[9][0] + ' </li><li class="team-item">Team ' + ranks[2][0] + '</li><li class="team-item">Team ' + ranks[5][0] + '</li> </ul><ul class="bracket bracket-2">      <li class="team-item">Team ' + '?' + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + ranks[0][0] + ' </li>  <li class="team-item">Team ' + ranks[3][0] + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + ranks[4][0] + ' </li>  <li class="team-item">Team ' + ranks[1][0] + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + '?' + ' </li>   <li class="team-item">Team ' + ranks[2][0] + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + ranks[5][0] + ' </li> </ul> <ul class="bracket bracket-3">      <li class="team-item">Team ' + '?' + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + '?' + ' </li>  <li class="team-item">Team ' + '?' + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + '?' + ' </li> </ul>      <ul class="bracket bracket-4">      <li class="team-item">Team ' + '?' + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + '?' + ' </li>    </ul>    </div></div><div class="control"><button type="submit" class="button is-primary" onclick="playoff10()">Simulate Round</button></div>';
  } else if (round==2) {
    
    document.getElementById('app').innerHTML ='<h1 class="title">The Results of the Tournament</h1><div class="tournament-container"><div class="tournament-headers"><h3>Wild Card</h3><h3>Quarter-Finals</h3><h3>Semi-Final</h3><h3>Final</h3></div> <div class="tournament-brackets"><ul class="bracket bracket-1">      <li class="team-item">Team ' + ranks[7][0] + ' <time>' + results[1][0] + ' - ' + results[1][1] + '</time> Team ' + ranks[8][0] + ' </li>  <li class="team-item">Team ' + ranks[0][0] + '</li><li class="team-item">Team ' + ranks[3][0] + '</li><li class="team-item">Team ' + ranks[4][0] + '</li><li class="team-item">Team ' + ranks[1][0] + '</li><li class="team-item">Team ' + ranks[6][0] + ' <time>' + results[0][0] + ' - ' + results[0][1] + '</time> Team ' + ranks[9][0] + ' </li><li class="team-item">Team ' + ranks[2][0] + '</li><li class="team-item">Team ' + ranks[5][0] + '</li> </ul><ul class="bracket bracket-2">      <li class="team-item">Team ' + winner[1] + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + ranks[0][0] + ' </li>  <li class="team-item">Team ' + ranks[3][0] + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + ranks[4][0] + ' </li>  <li class="team-item">Team ' + ranks[1][0] + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + winner[0] + ' </li>   <li class="team-item">Team ' + ranks[2][0] + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + ranks[5][0] + ' </li> </ul> <ul class="bracket bracket-3">      <li class="team-item">Team ' + '?' + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + '?' + ' </li>  <li class="team-item">Team ' + '?' + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + '?' + ' </li> </ul>      <ul class="bracket bracket-4">      <li class="team-item">Team ' + '?' + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + '?' + ' </li>    </ul>    </div></div><div class="control"><button type="submit" class="button is-primary" onclick="playoff10()">Simulate Round</button></div>';
  } else if (round==3) {
    
    document.getElementById('app').innerHTML ='<h1 class="title">The Results of the Tournament</h1><div class="tournament-container"><div class="tournament-headers"><h3>Wild Card</h3><h3>Quarter-Finals</h3><h3>Semi-Final</h3><h3>Final</h3></div> <div class="tournament-brackets"><ul class="bracket bracket-1">      <li class="team-item">Team ' + ranks[7][0] + ' <time>' + results[1][0] + ' - ' + results[1][1] + '</time> Team ' + ranks[8][0] + ' </li>  <li class="team-item">Team ' + ranks[0][0] + '</li><li class="team-item">Team ' + ranks[3][0] + '</li><li class="team-item">Team ' + ranks[4][0] + '</li><li class="team-item">Team ' + ranks[1][0] + '</li><li class="team-item">Team ' + ranks[6][0] + ' <time>' + results[0][0] + ' - ' + results[0][1] + '</time> Team ' + ranks[9][0] + ' </li><li class="team-item">Team ' + ranks[2][0] + '</li><li class="team-item">Team ' + ranks[5][0] + '</li> </ul><ul class="bracket bracket-2">      <li class="team-item">Team ' + winner[1] + ' <time>' + results[5][1] + ' - ' + results[5][0] + '</time> Team ' + ranks[0][0] + ' </li>  <li class="team-item">Team ' + ranks[3][0] + ' <time>' + results[4][0] + ' - ' + results[4][1] + '</time> Team ' + ranks[4][0] + ' </li>  <li class="team-item">Team ' + ranks[1][0] + ' <time>' + results[2][0] + ' - ' + results[2][1] + '</time> Team ' + winner[0] + ' </li>   <li class="team-item">Team ' + ranks[2][0] + ' <time>' + results[3][0] + ' - ' + results[3][1] + '</time> Team ' + ranks[5][0] + ' </li> </ul> <ul class="bracket bracket-3">      <li class="team-item">Team ' + winner[5] + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + winner[4] + ' </li>  <li class="team-item">Team ' + winner[2] + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + winner[3] + ' </li> </ul>      <ul class="bracket bracket-4">      <li class="team-item">Team ' + '?' + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + '?' + ' </li>    </ul>    </div></div><div class="control"><button type="submit" class="button is-primary" onclick="playoff10()">Simulate Round</button></div>';
  } else if (round==4) {
    
    document.getElementById('app').innerHTML ='<h1 class="title">The Results of the Tournament</h1><div class="tournament-container"><div class="tournament-headers"><h3>Wild Card</h3><h3>Quarter-Finals</h3><h3>Semi-Final</h3><h3>Final</h3></div> <div class="tournament-brackets"><ul class="bracket bracket-1">      <li class="team-item">Team ' + ranks[7][0] + ' <time>' + results[1][0] + ' - ' + results[1][1] + '</time> Team ' + ranks[8][0] + ' </li>  <li class="team-item">Team ' + ranks[0][0] + '</li><li class="team-item">Team ' + ranks[3][0] + '</li><li class="team-item">Team ' + ranks[4][0] + '</li><li class="team-item">Team ' + ranks[1][0] + '</li><li class="team-item">Team ' + ranks[6][0] + ' <time>' + results[0][0] + ' - ' + results[0][1] + '</time> Team ' + ranks[9][0] + ' </li><li class="team-item">Team ' + ranks[2][0] + '</li><li class="team-item">Team ' + ranks[5][0] + '</li> </ul><ul class="bracket bracket-2">      <li class="team-item">Team ' + winner[1] + ' <time>' + results[5][1] + ' - ' + results[5][0] + '</time> Team ' + ranks[0][0] + ' </li>  <li class="team-item">Team ' + ranks[3][0] + ' <time>' + results[4][0] + ' - ' + results[4][1] + '</time> Team ' + ranks[4][0] + ' </li>  <li class="team-item">Team ' + ranks[1][0] + ' <time>' + results[2][0] + ' - ' + results[2][1] + '</time> Team ' + winner[0] + ' </li>   <li class="team-item">Team ' + ranks[2][0] + ' <time>' + results[3][0] + ' - ' + results[3][1] + '</time> Team ' + ranks[5][0] + ' </li> </ul> <ul class="bracket bracket-3">      <li class="team-item">Team ' + winner[5] + ' <time>' + results[7][1] + ' - ' + results[7][0] + '</time> Team ' + winner[4] + ' </li>  <li class="team-item">Team ' + winner[2] + ' <time>' + results[6][0] + ' - ' + results[6][1] + '</time> Team ' + winner[3] + ' </li> </ul>      <ul class="bracket bracket-4">      <li class="team-item">Team ' + winner[7] + ' <time>' + '?' + ' - ' + '?' + '</time> Team ' + winner[6] + ' </li>    </ul>    </div></div><div class="control"><button type="submit" class="button is-primary" onclick="playoff10()">Simulate Round</button></div>';
  } else {
    document.getElementById('app').innerHTML ='<h1 class="title">The Results of the Tournament</h1><div class="tournament-container"><div class="tournament-headers"><h3>Wild Card</h3><h3>Quarter-Finals</h3><h3>Semi-Final</h3><h3>Final</h3></div> <div class="tournament-brackets"><ul class="bracket bracket-1">      <li class="team-item">Team ' + ranks[7][0] + ' <time>' + results[1][0] + ' - ' + results[1][1] + '</time> Team ' + ranks[8][0] + ' </li>  <li class="team-item">Team ' + ranks[0][0] + '</li><li class="team-item">Team ' + ranks[3][0] + '</li><li class="team-item">Team ' + ranks[4][0] + '</li><li class="team-item">Team ' + ranks[1][0] + '</li><li class="team-item">Team ' + ranks[6][0] + ' <time>' + results[0][0] + ' - ' + results[0][1] + '</time> Team ' + ranks[9][0] + ' </li><li class="team-item">Team ' + ranks[2][0] + '</li><li class="team-item">Team ' + ranks[5][0] + '</li> </ul><ul class="bracket bracket-2">      <li class="team-item">Team ' + winner[1] + ' <time>' + results[5][1] + ' - ' + results[5][0] + '</time> Team ' + ranks[0][0] + ' </li>  <li class="team-item">Team ' + ranks[3][0] + ' <time>' + results[4][0] + ' - ' + results[4][1] + '</time> Team ' + ranks[4][0] + ' </li>  <li class="team-item">Team ' + ranks[1][0] + ' <time>' + results[2][0] + ' - ' + results[2][1] + '</time> Team ' + winner[0] + ' </li>   <li class="team-item">Team ' + ranks[2][0] + ' <time>' + results[3][0] + ' - ' + results[3][1] + '</time> Team ' + ranks[5][0] + ' </li> </ul> <ul class="bracket bracket-3">      <li class="team-item">Team ' + winner[5] + ' <time>' + results[7][1] + ' - ' + results[7][0] + '</time> Team ' + winner[4] + ' </li>  <li class="team-item">Team ' + winner[2] + ' <time>' + results[6][0] + ' - ' + results[6][1] + '</time> Team ' + winner[3] + ' </li> </ul>      <ul class="bracket bracket-4">      <li class="team-item">Team ' + winner[7] + ' <time>' + results[8][1] + ' - ' + results[8][0] + '</time> Team ' + winner[6] + ' </li>    </ul>    </div></div><h1 class="title"> Team ' + winner[8] + ' is the Champion!</h1>';
    confetti.start(10000);
  }
}

var round = 1;
var teamOn = 0;
var results = [];
var winner = [];
var order, stats, salary_cap, teamwins, ranks;

data = (async function() {
  data = await grabData();
  return data
})();