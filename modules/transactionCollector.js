/**
 iZ³ | Izzzio blockchain - https://izzz.io
 @author: Andrey Nedobylsky (admin@twister-vl.ru)
 Module which made transactions collections
 */
  /*TODO узнать что делать с времнем жизни транзакции. нужно ли пробегать по коллекции и смотреть срок годности элементов в ней*/

'use strict';

const moment = require('moment');

class transactionCollector {

    constructor (blockchainObject) {
        this.blockchain = blockchainObject;
    }


    /**
     * получить длину коллекции
     * @returns {number}
     */
    getCollectionLength() {
        return this.blockchain.transactionsCollection.length;
    }

    /**
     * разбираем входящее сообщение
     * @param messageData
     * @returns {any}
     */
    parseTransactionMessageData(messageData) {
        let data;
        try {
            data = JSON.parse(messageData);
        } catch (e) {
            data = messageData;
        }
        return data;
    }

    /**
     * выбирает из массива элементы с заданным значением заданного параметра и возвращает массив. если массив пустой, значит, таких элементов нет
     * @param keyValue //значение свойства
     * @param keyName //название свойства
     * @param collection //коллекция, по которой осуществляется поиск
     * @returns {*}
     */
    findTransactions (keyValue, keyName, collection = this.blockchain.transactionsCollection) {
        return collection.find( item => item[keyname] === keyValue);
    }

    /**
     * получаем максимальный fee
     * @param collection
     * @returns {number}
     */
    getMaxFee(collection = this.blockchain.transactionsCollection) {
        // поскольку массив коллекции отсортирован в порядке убывания fee, то максимальный fee будет у элемента с индексом 0
        //коллекция пуста, то устанавливаем maxFee = -1;
        let maxFee = -1;
        if (this.getCollectionLength() > 0) {
            maxFee = collection[0];
        }
        return maxFee;
    }

    /**
     * получить список элементов с максимальным fee
     * @param count
     * @param shouldDelete //флаг удаления элемента из коллекции после получения
     * @returns {Array}
     */
    getTransactionsWithMaxFee(count = this.getCollectionLength() , shouldDelete = false) {
        count = count > 0 ? count : this.getCollectionLength(); //при любом отрицательном значении также будут браться все элементы

        let elems = []; //массив с выбранными элементами
        let collection = this.blockchain.transactionsCollection; //чтобы писать поменьше
        let maxFee = this.getMaxFee();
        if (maxFee >= 0) {
            if (shouldDelete)   {
                elems = collection.map((v,i,a) => {
                    if (v.fee === maxFee) {
                        return a.splice(i,1);
                    }
                });
            } else {
                elems = this.findTransactions(maxFee, 'fee');
            }
        }
        //обрезаем массив до нужной длины
        if (elems.length > count) {
            elems = elems.slice(0, count-1);
        }

        return elems;
    }

    /**
     * разбираем входящее сообщение. возвращаем объект добавленной транзакции если все прошло хорошо и блок добавлен
     * @param messageData
     * @returns {*}
     */
    handleMessage(messageData) {

        let collection = this.blockchain.transactionsCollection;
        let data = this.parseTransactionMessageData(messageData);
        //если data - не объект, значит, пришли неверные данные
        if (typeof data !== 'object') {
            return 1; //неправильный формат данных
        }

        //не слишком ли старая транзакция прищла
        if (moment().utc().valueOf() + this.blockchain.config.transactionTTL < data.timestamp){
            return 2; //срок годности вышел
        }

        //получаем хэш транзакции
        let hash = this.blockchain.calculateHash('','','',data);
        //если такая транзакция уже есть, значит, мы уже ее обработали и ничего не делаем
        if (this.findTransactions(hash) === []) {
            return 3; //транзакция уже есть в коллекции
        }

        //проверяем наличие поля fee
        if (!data.fee) {
            data.fee = 0;
        }

        //проверяем, нужно добавление в коллекцию или нет
        if (this.getCollectionLength() < this.blockchain.config.transactionCollectionMaxElements && +collection[this.getCollectionLength()-1].fee >= +data.fee) {
            return 4;// ничего не делаем, т.к. минимальный fee больше пришедшего
        }

        //все проверки прошли успешно, значит, можно добавлять в коллекцию
        //добавляем хэш
        data.hash = hash;
        collection.push(data);
        //сортируем по убыванию fee
        collection.sort((a,b) => b.fee - a.fee);
        //отрезаем лишнее
        this.blockchain.transactionsCollection = collection.slice(0, this.blockchain.config.transactionCollectionMaxElements);
        return data;
    }

    /**
     * создаем сообщение с оповещением о новой транзакции
     * @param data
     * @param index
     * @returns {{type: number, data: *, index: string}}
     */
    createMessage(data, index = ''){
        let JSONdata = JSON.stringify(data);
        return {
            type: this.blockchain.messageType.TRANS_COLL,
            data: JSONdata,
            index:index
        }
    }



}