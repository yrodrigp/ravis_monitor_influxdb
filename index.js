"use strict"

// const AppMetrics = require("appmetrics")
const Kapacitor = require("kapacitor").Kapacitor
const MQTT = require("mqtt")
const Influx = require("influx")
const SCOPES = Object.freeze({
    "executionsRavis": "executionsRavis"
})

const ACTIONS = Object.freeze({
    "add": "add",
    "delete": "delete"
})

function RavisMonitorInfluxDB({host, port, username, password, database, callback}) {

    // const monitoring = AppMetrics.monitor()
    const cnx = `http://${username}:${password}@${host}:${port}/`
    console.log("connecting to", cnx)
    const kapacitor = new Kapacitor(cnx)
    const taskID = "RavisTaskGetInfo"

    this.verifyInfluxConnection = function () {
        const influx = new Influx.InfluxDB({
            host,
            database,
            // schema: [{
            //     measurement: 'response_times',
            //     fields: {
            //       path: Influx.FieldType.STRING,
            //       duration: Influx.FieldType.INTEGER
            //     },
            //     tags: [
            //       'host'
            //     ]
            //   }
            // ]
           })
        return influx.ping(5000)
    }

    function deleteTask() {
        console.log("deleting task")
        return kapacitor.removeTask(taskID)
    }

    async function createTask(scope, reset = false) {
        if (reset === true) {
            await deleteTask()
        } 

        var script = `stream\n`
        script += `    |from()\n`
        script += `        .measurement('${scope}')\n`
        script += `    |alert()\n`
        script += `        .message('CPU usage over 90%')\n`
        script += `        .mqtt('alerts')\n`
        script += `          .brokerName('localhost')\n`
        script += `          .qos(1)\n`
        // script += `          .retained()\n`.trim()

        // var script = `stream\n`
        // script += `    |from()\n`
        // script += `        .measurement('${scope}')\n`
        // script += `    |alert()\n`
        // script += `        .crit(lambda: "client" == 'BlazeMeter')\n`
        // script += `        .message('CPU usage over 90%')\n`
        // script += `        .topic('${scope}')\n`

        console.log("creating task", script)
        const response = await kapacitor.createTask({
            id: taskID,
            type: "stream",
            dbrps: [{ db: database, rp: "autogen" }],
            script,
            status: "enabled",
          })
        return response
    }

    this.createEnvironment = async function (action, scope, reset = false) {
        if (!action) throw "Action is required."
        // const tasks = await kapacitor.getTasks()
        // console.log("tasks got", tasks)
        // const env = tasks.tasks.find(i => i.id === taskID)
        switch (action) {
            case ACTIONS.add:
                if (!scope) throw "Scope is required."
                // if (!env) {
                    const result = await createTask(scope, reset)
                    return result
                // } 
                break
            case ACTIONS.delete:
                await kapacitor.removeTask(taskID)
                break
            default: break
        }
        return null
    }

    this.ping = async function () {
        return new Promise((resolve) => {
            kapacitor.ping(5000)
                .then(hosts => {
                    let is = false
                    hosts.forEach(host => {
                        if (host.online)
                            is = true
                    })
                    resolve(is)
                })
        })
    }

    this.insertTest = function() {
        setInterval(() => 
            influx.writePoints([{
                measurement: SCOPES.executionsRavis,
                tags: { host: os.hostname() },
                fields: { duration, path: req.path },
                }])
                .then(() => {
                    const query = `
                        select * from response_times
                        where host = ${Influx.escape.stringLit(os.hostname())}
                        order by time desc
                        limit 10
                    `
                    return influx.query(query)
                }).then(rows => {
                    rows.forEach(row => console.log(`A request to ${row.path} took ${row.duration}ms`))
                }), 5000)
    }

    this.listen = function (scope) {
        const clientMQTT  = MQTT.connect("mqtt://" + host)
        clientMQTT.on("connect", function () {
            clientMQTT.subscribe("#", function (err) {
                if (!err) {
                    clientMQTT.publish('executionsRavis', 'Testing')
                    console.log("Subscribing to", scope)
                } else throw err
            })
        })
        
        clientMQTT.on("message", function (topic, message) {
            // message is Buffer
            // if (topic !== scope) return
            console.log(topic, message.toString())
            // clientMQTT.end()
        })

        clientMQTT.on("close", function(){
            console.log("connection mqtt closed")
        })

        clientMQTT.on("disconnect", function(){
            console.log("connection mqtt disconnected")
        })

        clientMQTT.on("offline", function(){
            console.log("connection mqtt offline")
        })

        clientMQTT.on("error", function(err){
            console.log("connection mqtt error", err)
        })
    }
    
    this.disconnect = function () {
        clientMQTT.end()
    }

    /* events */
    // monitoring.on("initialized", function (env) {
    //     env = monitoring.getEnvironment()
    //     for (var entry in env) {
    //         console.log(entry + ':' + env[entry])
    //     };
    // })

    // monitoring.on("cpu", cpu => {
    //     console.log("CPU  process", cpu.process, "System", cpu.system)
    // })
}

/* Adding tables to handle with topics */
RavisMonitorInfluxDB.SCOPES = SCOPES

/* Adding actions */
RavisMonitorInfluxDB.ACTIONS = ACTIONS

module.exports = RavisMonitorInfluxDB