async function verify(req, res) {
    var response = {}
    const {rIdName, rAbout} = req.body;
    if (rIdName.length > 2 && rIdName.length < 24) {
        response.code = 0;
        response.msg = "Verified! Click \"CREATE ACCOUNT\" to create your account.";
        res.send(response);
    } else {
        response.code = 1;
        response.msg = "Identity length is invalid.";
        res.send(response);
    }
}

module.exports = {
    verify: verify
}