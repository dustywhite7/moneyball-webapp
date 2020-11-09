// in main.js

function start() {
  var teams = parseInt(document.getElementById("player_count").value);
  var salary_cap = parseInt(document.getElementById("salary_cap").value);

  document.getElementById('app').innerHTML = "<h1 class='title'>Player Selection</h1><h3 class='subtitle'>You have selected to play with " + teams + " teams, and a salary cap of $" + salary_cap + " Million.</h3>";

  document.getElementById('app').innerHTML += "<div id='order'></div>"

  order = d3.shuffle(d3.range(1,teams+1))
  
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

async function grabData() {
  try{
    const response = fetch("https://raw.githubusercontent.com/dustywhite7/moneyball-webapp/master/data/playersheet2020.json");
    const data = await (await response).json();
    console.log(`Here: ${data[0]['first']}`)
} catch(e) {
    console.log(`Error: ${e}`)
}
}



grabData();