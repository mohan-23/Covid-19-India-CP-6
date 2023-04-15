const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "covid19India.db");

const app = express();
app.use(express.json());

let db = null;

const initializeDBServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at: http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};
initializeDBServer();

let convertDbObjectToRequiredObject = (object) => {
  return {
    stateId: object.state_id,
    stateName: object.state_name,
    population: object.population,
  };
};

//Get States API
app.get("/states/", async (request, response) => {
  const getStatesQuery = `SELECT * FROM state;`;
  const stateObjects = await db.all(getStatesQuery);
  response.send(
    stateObjects.map((eachObject) =>
      convertDbObjectToRequiredObject(eachObject)
    )
  );
});

//Get State API
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `SELECT * FROM state
                        WHERE state_id = ${stateId};`;
  const stateObject = await db.get(getStateQuery);
  response.send(convertDbObjectToRequiredObject(stateObject));
});

//Get Districts API
app.get("/districts/", async (request, response) => {
  const getDistrictQuery = `SELECT * FROM district;`;
  const districtObject = await db.all(getDistrictQuery);
  response.send(districtObject);
});

//Post district API
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const postDistrictQuery = `INSERT INTO district
                               (district_name, state_id, cases, cured, active, deaths)
                               VALUES ('${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths});`;
  const postDistrict = await db.run(postDistrictQuery);
  response.send("District Successfully Added");
});

const convertDistrictObjectToRequiredObject = (object) => {
  return {
    districtId: object.district_id,
    districtName: object.district_name,
    stateId: object.state_id,
    cases: object.cases,
    cured: object.cured,
    active: object.active,
    deaths: object.deaths,
  };
};

//Get district API
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `SELECT * FROM district
                        WHERE district_id = ${districtId};`;
  const districtObject = await db.get(getDistrictQuery);
  response.send(convertDistrictObjectToRequiredObject(districtObject));
});

//Delete district API
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `DELETE FROM district
                        WHERE district_id = ${districtId};`;
  const deleteDistrictObject = await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//Update district API
app.put("/districts/:districtId/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const { districtId } = request.params;
  const putDistrictQuery = `UPDATE district
                            SET district_name = '${districtName}',
                                state_id = ${stateId},
                                cases = ${cases},
                                cured = ${cured},
                                active = ${active},
                                deaths = ${deaths}
                            WHERE district_id = ${districtId};`;
  const putDistrictObject = await db.run(putDistrictQuery);
  response.send("District Details Updated");
});

//Get totalValues API
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getTotalStats = `SELECT SUM(cases),
                                  SUM(cured),
                                  SUM(active),
                                  SUM(deaths)
                            FROM district
                            WHERE state_id  = ${stateId};`;
  const stats = await db.get(getTotalStats);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

//Get stateName API
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `SELECT state_id FROM district
                              WHERE district_id = ${districtId};`;
  const getDistrictIdQueryResponse = await db.get(getDistrictIdQuery);

  const getStateNameQuery = `SELECT state_name AS stateName FROM state
                             WHERE state_id = ${getDistrictIdQueryResponse.state_id};`;
  const getStateNameQueryResponse = await db.get(getStateNameQuery);
  response.send(getStateNameQueryResponse);
});
module.exports = app;
