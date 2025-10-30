async function verify(req, res) {
    var response = {}
    const {rFirstName, rLastName, rOtherName} = req.body;
    if (rFirstName.length > 2 && rFirstName.length < 24) {
        if (rLastName.length > 2 && rLastName.length < 24) {
            if (rOtherName.length != 0) {
                response.code = 0;
                response.msg = "Names verified!";
                res.send(response);
            } else {
                response.code = 3;
                response.msg = "You don't have other names?";
                res.send(response);
            }
        } else {
            response.code = 2;
            response.msg = "Last name length is invalid.";
            res.send(response);
        }
    } else {
        response.code = 1;
        response.msg = "First name length is invalid.";
        res.send(response);
    }
}

module.exports = {
    verify: verify
}