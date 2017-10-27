var blocks = [];
const maxBlockCount = 30;

module.exports = {

    post: function (repository) {
        return function (request, response) {
            if (blocks.length >= maxBlockCount) {
                repository.save(blocks);
                blocks = [];
            }

            let block = request.body;
            block.timestamp = repository.getCurrentDate().toISOString();
            blocks.push(block);

            response.sendStatus(200);
        }
    },
    get: function (repository) {
        return function (req, res) {
            let from = req.query.from;
            let to = req.query.to;
            const promise = repository.getDHT(from ? parseInt(from): undefined, to ? parseInt(to) : undefined);
            promise.then(v => res.json(v))
        }

    }
};