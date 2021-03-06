/**
 iZ³ | Izzzio blockchain - https://izzz.io
 @author: Andrey Nedobylsky (admin@twister-vl.ru)
 */


const Signable = require('../../blocks/signable');
const CryptoJS = require("crypto-js");
let type = 'EcmaContractCallBlock';

/**
 * EcmaContract block
 */
class EcmaContractCallBlock extends Signable {

    /**
     * Get block type
     * @return {string}
     */
    static get blockType() {
        return type;
    }

    /**
     * Create EcmaContract calling block
     * @param {string} address
     * @param {string} method
     * @param {Object} args
     * @param {Object} state
     */
    constructor(address, method, args, state) {
        super();
        this.type = type;
        this.address = address;
        this.state = state;
        this.method = method;
        this.args = args;
        this.generateData();
    }

    /**
     * Data hash for sign
     */
    generateData() {
        this.data = CryptoJS.SHA256(this.type + this.address + JSON.stringify(this.state) + JSON.stringify(this.args) + this.method).toString();
    }


}

module.exports = EcmaContractCallBlock;