const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const path = require('path');



const indexPath= {
     hostvariable: "http://localhost:5000"
    //  hostvariable: "https://neinsoft1.nittsu.co.in:8188"
    // hostvariable: "http://10.206.50.58:8180"
};



module.exports = indexPath;