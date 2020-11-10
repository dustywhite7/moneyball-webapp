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
    console.log(`Here: ${data.length}`);
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

}

function simulateGame() {

}

function simulateSeries() {

}

var round = 1;
var teamOn = 0;
var order, stats, salary_cap;

data = (async function() {
  data = await grabData();
  return data
})();