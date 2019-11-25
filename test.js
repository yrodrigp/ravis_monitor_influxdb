const RavisMonitorInfluxDB = require("./index")

const env = new RavisMonitorInfluxDB({
    host: "18.202.41.95",
    port: 9092,
    database: "daptdb",
    username: "daptdbuser",
    password: "QVdTI2RhcHRkYnVzZXI=",
})

// env.createEnvironment(RavisMonitorInfluxDB.ACTIONS.add, RavisMonitorInfluxDB.SCOPES.requestsRaw)
//     .then(result => {
//         console.log(result)
//     })
//     .catch(err => {
//         throw err
//     })

env.listen()