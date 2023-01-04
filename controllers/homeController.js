const BigPromise = require("../middlewares/bigPromise");

exports.home = BigPromise((req, res) => {
    res.status(200).json({
        success: true,
        greeting: "Hello form API"
    });
});

/*
exports.homeDummy = async (req, res) => {
    try {
        //const db = await something
        //if something went wrong throw error
        res.status(200).json({
            success: true,
            greeting: "Hello form API"
        });
    } catch (error) {
        console.log(error);
    }   
};
*/