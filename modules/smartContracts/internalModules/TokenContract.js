/**
 iZ³ | Izzzio blockchain - https://izzz.io
 @author: Andrey Nedobylsky (admin@twister-vl.ru)
 */

/**
 * Basic token contract
 */
class TokenContract extends Contract {

    /**
     * Initialization method with emission
     * @param {BigNumber| Number| String} initialEmission Amount of initial emission
     * @param {Boolean} mintable  Can mintable by owner in feature?
     */
    init(initialEmission, mintable = false) {
        super.init();
        this.TransferEvent = new Event('Transfer', 'string', 'string', 'number');
        this.MintEvent = new Event('Mint', 'string', 'number');
        this.BurnEvent = new Event('Burn', 'string', 'number');

        this.mintable = mintable;
        this.wallets = new TokensRegister(this.contract.ticker);

        if(Number(initialEmission) > 0 && contracts.isDeploy()) { //Calls on deploying
            this.wallets.mint(this.contract.owner, initialEmission);
            this.MintEvent.emit(this.contract.owner, new BigNumber(initialEmission));
        }
    }

    /**
     * Get balance of wallet
     * @param address
     * @return {*}
     */
    balanceOf(address) {
        return this.wallets.balanceOf(address).toFixed();
    }


    /**
     * Return total supply
     * @return {*|BigNumber}
     */
    totalSupply() {
        return this.wallets.totalSupply().toFixed();
    }

    /**
     * Transfer method
     * @param to
     * @param amount
     */
    transfer(to, amount) {
        this.wallets.transfer(state.from, to, amount);
        this.TransferEvent.emit(state.from, to, new BigNumber(amount));
    }

    /**
     * Burn users tokens
     * @param amount
     */
    burn(amount) {
        this.wallets.burn(state.from, amount);
        this.BurnEvent.emit(state.from, new BigNumber(amount));
    }

    /**
     * Token minting
     * @param amount
     */
    mint(amount) {
        this.assertOwnership('Minting available only for contract owner');
        assert.true(this.mintable, 'Token is not mintable');
        this.wallets.mint(state.from, amount);
        this.MintEvent.emit(state.from, new BigNumber(amount));
    }
}