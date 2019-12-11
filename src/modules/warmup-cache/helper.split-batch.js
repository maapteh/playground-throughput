module.exports = (arr, batchSize) => {
    return arr.reduce((accumulator, element, index) => {
        const batchIndex = Math.floor(index / batchSize);
        if (Array.isArray(accumulator[batchIndex])) {
            accumulator[batchIndex].push(element);
        } else {
            accumulator.push([element]);
        }
        return accumulator;
    }, []);
}