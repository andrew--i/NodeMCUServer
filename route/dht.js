
module.exports = {
   
    post: function(repository) {
        return function(request, response) {

            repository.save(request.body);

            response.sendStatus(200);
        }
    }
}