import Ble from '../../utils/ble'
let ble = new Ble()

Page({
  data: {
    Bles: []
  },
  onLoad: function () {
    this.$on('searchBle', this.getDevices)
  },

  onShow() {},

  searchBle() {
    // 初始化
    ble.openBluetoothAdapter().then(_ => {
      // 设备信息获取 ios 安卓逻辑不同
      ble.getPhoneInfo(() => {
        
        // 蓝牙搜索
        ble.init().then(res => {
          console.log('返回了嘛')
          console.log(res)
          if (res.devices.length == 0) {
            return
          }
          this.setData({
            Bles: res.devices
          })
        }).catch(res => {
          console.log('搜索蓝牙出错', res)
        })
      })
    })
  },

  /**
   * 连接蓝牙
   */
  connectBle() {
    this.$emit('searchBle', {'ceshi': 1111})
  },

  getDevices(devices) {
    console.log('测试')
    console.log(devices)
    console.log(this.data)
  }
})