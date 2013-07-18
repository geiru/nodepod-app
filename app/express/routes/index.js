var app_core = require(global.buildAppPath('app/core/core.js')),
    masterList = app_core.masterList;


function buildVars(error) {
    var masters = [],
        clientPort;

    if (typeof error == 'undefined') {
        error = false;
    }

    masterList.each(function(master) {
        masters.push(master.output());
    })

    return {
        error: error,
        masters: JSON.stringify(masters)
    }
}


exports.index = function(req, res, error) {
    res.render('index', buildVars(error));
};

exports.json = {
    index:function(req, res, error) {
        res.json(buildVars(error));
    }
};

