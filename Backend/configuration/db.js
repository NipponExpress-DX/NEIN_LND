const mysql = require("mysql2");
const sql = require("mssql");

// MySQL connection pool configuration for 'hrmdb'
// const hrmdb = mysql.createPool({
//     host: "10.39.194.5",
//     user: "root",
//     password: "",
//     database: "hrmdb",
//     connectionLimit: 10, // Maximum number of connections in the pool
//     waitForConnections: true,
//     queueLimit: 0
// });

// // // // MySQL connection pool configuration for 'leavemanagement'
// const leavemanagement = mysql.createPool({
//     host: "10.39.194.5",
//     user: "root",
//     password: "",
//     database: "leavemanagement",
//     connectionLimit: 10, // Maximum number of connections in the pool
//     waitForConnections: true,
//     queueLimit: 0
// });
const hrmdb = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "hrmdb",
    connectionLimit: 10, // Maximum number of connections in the pool
    waitForConnections: true,
    queueLimit: 0
});



const leavemanagement = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "leavemanagement",
    connectionLimit: 10, // Maximum number of connections in the pool
    waitForConnections: true,
    queueLimit: 0
});




// Function to handle MySQL reconnection in case of connection loss
function handleDisconnect(pool) {
    pool.on('error', (err) => {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('MySQL connection lost. Reconnecting...');
            handleDisconnect(pool); // Reconnect if the connection is lost
        } else {
            throw err; // Other errors should be handled accordingly
        }
    });
}

// Add reconnection handling for each MySQL connection pool
handleDisconnect(hrmdb);
handleDisconnect(leavemanagement);







// Create SQL Server connection pool
// const sqlServerConnectionPool = new sql.ConnectionPool(sqlConfig)
//     .connect()
//     .then(pool => {
//         console.log("Connected to SQL Server");
//         return pool;
//     })
//     .catch(err => {
//         console.log("Failed to connect to SQL Server:", err);
//     });


module.exports = {
    hrmdb,
    leavemanagement// export the promise
};


