'use strict'

const db = require('APP/db')
const OrderProduct = require('./orderProduct')
const Product = require('./product')
const Order = require('./order')
const {expect} = require('chai')
const Promise = require('bluebird')

describe('OrderProduct', () => {
  before('wait for the db', () => db.didSync
  .then(() => Product.destroy({ where: {}})))


  describe('definition', () => {

    it('has expected price definition', () => {
      expect(OrderProduct.attributes.price).to.be.an('object');
    })

    it('has expected quantity definition', () => {
      expect(OrderProduct.attributes.quantity).to.be.an('object');
    })

  })

  describe('validations', () => {
    let product;
    let order;
    let orderProduct;
    let testPrice;
    before('test order', () =>
      Promise.all([
        Product.create({
          name: 'Product1',
          description: 'A thing',
          price: 12.00
        }),
        Order.create({
          status: 'pending'
        })])
      .spread(function(prod, ord){
        product = prod
        order = ord
        return order.addProduct(product, {quantity: 100, price: product.price})
      }).then( function() {
        return OrderProduct.findOne({where:
          {product_id: product.id,
           order_id: order.id
          }})
        .then(function(res) {
          orderProduct = res;
        })
      })
    )
    after('destroy all in table', () => {
      //TODO This
    })

    it("has a price based on product price", () => {
      expect(orderProduct.price).to.equal(product.price);
    })

    it("when the order is pending, price should update when product price changes", () => {
       return product.update({price: 25})
      .then(function(changedProduct) {
        return OrderProduct.findOne(
          {where:
            {product_id: product.id,
             order_id: order.id
          }})
        })
        .delay(10).then(function(updatedOP) {
          //Refresh the instance
          return updatedOP.reload()
      }).then(function(reloadedOP) {
        expect(reloadedOP.price).to.equal(product.price)
      }) 
    })

    it("when the order is completed, price no longer updates", () => {
      //TODO Update Order to "completed", update price again
      return order.update({
        status: "completed"
      })
      .then(function(updatedOrder) {
        return product.update({
          price: 14.00
        })
      })
      .then(function(updatedPrice) {
        return OrderProduct.findOne({
          where: {
            product_id: product.id,
            order_id: order.id
          }
        })
      })
      .then(function(OP) {
        return OP.reload()
      })
      .then(function(reloadedOP) {
        expect(reloadedOP.price).to.not.equal(product.price)
      })
    })

  })

})
