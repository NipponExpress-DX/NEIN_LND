const express = require('express');
const router = express.Router();

const {
    addRole,
    deleteRole,
    listRole
    
} = require('../controllers/Roles/roles');

const {
    addUserRole,
    deletUsereRole,
    UpdateUserRole,
    activeStatusUserRole,
    activeListUserRole,
    activeListUserRoleToEMPOnly
    
} = require('../controllers/Roles/users');



const {
    getFunctionsList,
    addRoleManagement,
    UpdateRoleManagement,
    DeleteRoleManagement,
    ListRoleManagement,
    FunctionalityListforRoleManagement
    
} = require('../controllers/Roles/rolemanagement ');


//--------role master API's----------//
// role adding
router.post('/roleMaster/Roleadd', (req, res) => {
    addRole(req, res);
});

// role de-activating
router.post('/roleMaster/Roledelete', (req, res) => {
    deleteRole(req, res);
});

// role active list 
router.post('/roleMaster/Rolelist', (req, res) => {
    listRole(req, res);
});


//--------User role master API's----------//
// user role adding
router.post('/roleMaster/addUserRole', (req, res) => {
    addUserRole(req, res);
});

// user role de-activating
router.post('/roleMaster/deletUsereRole', (req, res) => {
    deletUsereRole(req, res);
});

// user role  update
router.post('/roleMaster/updateUserRole', (req, res) => {
    UpdateUserRole(req, res);
});



// user role  activeStatusUserRole 0 or 1
router.post('/roleMaster/activeStatusUserRole', (req, res) => {
    activeStatusUserRole(req, res);
});


// user role  activeListUserRole
router.post('/roleMaster/activeListUserRole', (req, res) => {
    activeListUserRole(req, res);
});



// user role  activeListUserRoleToEMPOnly
router.post('/roleMaster/activeListUserRoleToEMPOnly', (req, res) => {
    activeListUserRoleToEMPOnly(req, res);
});




//--------User role management master API's----------//
// user role functions 
router.post('/roleMaster/FunctionsList', (req, res) => {
    getFunctionsList
    
    (req, res);
});


// assigning function to add Role Management
router.post('/roleMaster/addRoleManagement', (req, res) => {
    addRoleManagement(req, res);
});

router.post('/roleMaster/UpdateRoleManagement', (req, res) => {
    UpdateRoleManagement(req, res);
});


router.post('/roleMaster/DeleteRoleManagement', (req, res) => {
    DeleteRoleManagement(req, res);
});


router.post('/roleMaster/ListRoleManagement', (req, res) => {
    ListRoleManagement(req, res);
});
router.post('/roleMaster/FunctionalityListforRoleManagement', (req, res) => {
    FunctionalityListforRoleManagement(req, res);
});

module.exports = router; 
