import Ble from '../../utils/ble'
let ble = new Ble()

Page({
  data: {
    Bles: [],
    hardwareInfo: null
  },
  onLoad: function () {
    
  },

  onShow() {},

  searchBle(e) {
    console.log(e)
    // 初始化
    ble.openBluetoothAdapter().then(_ => {
      // 设备信息获取 ios 安卓逻辑不同
      ble.getPhoneInfo(() => {
        // 蓝牙搜索
        ble.init().then(res => {
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
  connectBle(e) {
    console.log('点击参数')
    console.log(e.currentTarget.dataset.deviceId)
    let deviceId = '004E5B44-0EEE-3F57-D384-8821B4E81CE9'
    ble.createBLEConnection(deviceId).then(res => {
      console.log('是否连接成功')
      console.log(res)
    })
  },

  writeBleOne() {
    ble.writeBle()
  }
})