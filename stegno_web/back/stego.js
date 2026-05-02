const { PNG } = require('pngjs');

function toBinary(data) {
    let binary = '';
    for (let i = 0; i < data.length; i++) {
        binary += data.charCodeAt(i).toString(2).padStart(8, '0');
    }
    return binary;
}

function fromBinary(binaryData) {
    let result = '';
    for (let i = 0; i < binaryData.length; i += 8) {
        const byte = binaryData.slice(i, i + 8);
        result += String.fromCharCode(parseInt(byte, 2));
    }
    return result;
}

function embed(pngBuffer, data) {
    return new Promise((resolve, reject) => {
        const png = PNG.sync.read(pngBuffer);
        const { width, height, data: pixelData } = png;

        const binaryData = toBinary(data);
        const header = binaryData.length.toString(2).padStart(32, '0');
        const fullData = header + binaryData;

        const capacity = width * height * 3;
        if (fullData.length > capacity) {
            return reject(new Error('Image too small for this data'));
        }

        let dataIndex = 0;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (dataIndex >= fullData.length) break;

                const idx = (y * width + x) * 4;

                if (dataIndex < fullData.length) {
                    pixelData[idx] = (pixelData[idx] & ~1) | parseInt(fullData[dataIndex]);
                    dataIndex++;
                }

                if (dataIndex < fullData.length) {
                    pixelData[idx + 1] = (pixelData[idx + 1] & ~1) | parseInt(fullData[dataIndex]);
                    dataIndex++;
                }

                if (dataIndex < fullData.length) {
                    pixelData[idx + 2] = (pixelData[idx + 2] & ~1) | parseInt(fullData[dataIndex]);
                    dataIndex++;
                }
            }
            if (dataIndex >= fullData.length) break;
        }

        const outputBuffer = PNG.sync.write(png);
        resolve(outputBuffer);
    });
}

function extract(pngBuffer) {
    const png = PNG.sync.read(pngBuffer);
    const { width, height, data: pixelData } = png;

    let binaryData = '';

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            binaryData += String(pixelData[idx] & 1);
            binaryData += String(pixelData[idx + 1] & 1);
            binaryData += String(pixelData[idx + 2] & 1);
        }
    }

    const dataLen = parseInt(binaryData.slice(0, 32), 2);
    const dataBits = binaryData.slice(32, 32 + dataLen);

    return fromBinary(dataBits);
}

module.exports = { embed, extract };
