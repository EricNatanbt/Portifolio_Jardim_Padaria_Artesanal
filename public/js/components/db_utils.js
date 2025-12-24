const fs = require('fs').promises;
const path = require('path');

const ordersFilePath = path.join(__dirname, 'orders.json');

async function readJsonFile(filePath, defaultContent = []) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log(`Arquivo não encontrado: ${filePath}. Criando arquivo vazio.`);
            await writeJsonFile(filePath, defaultContent);
            return defaultContent;
        }
        throw error;
    }
}

async function writeJsonFile(filePath, data) {
    const jsonString = JSON.stringify(data, null, 4);
    await fs.writeFile(filePath, jsonString, 'utf8');
}

async function readOrders() {
    return readJsonFile(ordersFilePath, []);
}

async function writeOrders(orders) {
    await writeJsonFile(ordersFilePath, orders);
}

module.exports = {
    readOrders,
    writeOrders
};
