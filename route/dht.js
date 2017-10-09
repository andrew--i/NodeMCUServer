
module.exports = {
   
    post: function(repository) {
        return function(request, response) {

            console.log('body is:' + request.body)
            repository.save(request.body);

            response.sendStatus(200);
        }
    }
}