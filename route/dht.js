
var blocks = [];
const maxBlockCount = 30;

module.exports = {
   
    post: function(repository) {
        return function(request, response) {
            if(blocks.length >= maxBlockCount) {
                repository.save(blocks);
                blocks = [];
            }

            blocks.push(request.body);

            response.sendStatus(200);
        }
    }
}