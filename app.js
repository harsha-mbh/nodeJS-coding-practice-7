const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

//API1
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT player_id AS playerId,
    player_name AS playerName
    FROM player_details;`;
  const playersArray = await db.all(getPlayersQuery);
  response.send(playersArray);
});

//API2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT player_id AS playerId,
    player_name AS playerName
    FROM player_details
    WHERE player_id = ${playerId};`;
  const player = await db.get(getPlayerQuery);
  response.send(player);
});

//API3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
    UPDATE player_details
    SET player_name = '${playerName}';`;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//API4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT match_id AS matchId,
    match, year
    FROM match_details
    WHERE match_id = ${matchId};`;
  const match = await db.get(getMatchQuery);
  response.send(match);
});

//API5
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchQuery = `
    SELECT match_details.match_id AS matchId,
    match_details.match AS match,
    match_details.year AS year
    FROM match_details INNER JOIN player_match_score ON match_details.match_id = player_match_score.match_id
    WHERE player_match_score.player_id = ${playerId};`;
  const matchesDetails = await db.all(getPlayerMatchQuery);
  response.send(matchesDetails);
});

//API6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersQuery = `
    SELECT player_details.player_id AS playerId,
    player_details.player_name AS playerName 
    FROM player_match_score LEFT JOIN player_details ON 
    player_match_score.player_id = player_details.player_id
    WHERE player_match_score.match_id = ${matchId};`;
  const playersArray = await db.all(getPlayersQuery);
  response.send(playersArray);
});

//API7
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScores = `
SELECT player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(player_match_score.fours) AS totalFours,
    SUM(player_match_score.sixes) AS totalSixes 
    FROM player_match_score LEFT JOIN player_details ON 
    player_match_score.player_id = player_details.player_id
    WHERE player_match_score.player_id = ${playerId}
    GROUP BY playerName;`;
  const playerDetails = await db.get(getPlayerScores);
  response.send(playerDetails);
});

module.exports = app;
