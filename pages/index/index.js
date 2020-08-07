import Ble from '../../utils/ble'
let ble = new Ble()

Page({
  data: {
  },
  onLoad: function () {
  },

  onShow() {
  },

  searchBle() {
    ble.openBluetoothAdapter().then(res => {
      console.log(res)
    })
  }
})
