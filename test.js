const RavisMonitorInfluxDB = require("./index")

const env = new RavisMonitorInfluxDB({
    host: "18.202.41.95",
    port: 9092,
    database: "daptdb",
    username: "daptdbuser",
    password: "QVdTI2RhcHRkYnVzZXI=",
})

//insert executionsRavis,client=BlazeMeter,proyect=BlazeMeter,scene=Booking_flow pid="23343",result="0",state="start",type="test"

console.log("starting")

env.verifyInfluxConnection()
    .then(status => {
        const add = RavisMonitorInfluxDB.ACTIONS.add
        const measurement = RavisMonitorInfluxDB.SCOPES.executionsRavis
        const reset = true

        env.createEnvironment(add, measurement, reset)
            .then(result => {
                console.log(result)
            })
            .catch(err => {
                throw err
            })
        env.listen(RavisMonitorInfluxDB.SCOPES.executionsRavis)
    })
    .catch(err => {
        throw err
    })