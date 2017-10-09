
module.exports = {
    options: function () {
        return function(request, response) {
            response.setHeader("Access-Control-Allow-Origin", "*");
            response.setHeader("Access-Control-Allow-Headers", "*");
            response.setHeader("Access-Control-Allow-Methods", "POST");
            response.setHeader("Access-Control-Allow-Headers", "Content-Type");
            response.sendStatus(200);
        }
    },
    post: function(repository) {
        return function(request, response) {

            repository.save(request.body);

            response.header("Access-Control-Allow-Origin", "*");
            response.header("Access-Control-Allow-Headers", "*");
            response.header("Access-Control-Allow-Methods", "POST");
            response.header("Content-Type", "application/json;charset=UTF-8");
            response.sendStatus(200);
        }
    }
}