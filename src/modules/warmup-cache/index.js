module.exports = function() {

    const fetch = require('node-fetch');

    const splitBatch = require('./helper.split-batch');
    const forEach = require('./helper.for-each');
    const urls = require('../../constants/urls');
    const baseUrl = 'http://localhost:3000';
    const batchSize = 3;
    const batches = splitBatch(urls, batchSize);

    // This is a mock request function
    const sendRequest = (url) => {
        return new Promise(async (resolve, reject) => {
            try {
                const response = await fetch(`${baseUrl}${url}`);
                resolve({ url: url, status: response.status});
            } catch (error) {
                resolve({ url: url, status: 500})
            }
        })
    }

    console.group('🔥 warming up local cache')

    ;(async () => {
        let results = []
        await forEach(batches, async (batch, i) => {
            console.log(`✔ sending batch ${(i + 1)}`);
            const responses = await Promise.all(batch.map(async(url) => {
                return await sendRequest(url);
            }));
            results.push.apply(results, responses);
        });
        console.log(`✔ local cache is now filled (${urls.length} pages)`);
        console.table(results);
        console.groupEnd();
    })();
}