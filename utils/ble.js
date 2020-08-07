import {
    promisic,
    getPhoneInfo
} from './util'


export default class Ble {
    constructor() {
        this.setPhoneInfo()
    }

    /**
     * 初始化蓝牙模块。iOS 上开启主机/从机模式时需分别调用一次，指定对应的 mode。
     */
    openBluetoothAdapter() {
        return new Promise((resolve, reject) => {
            wx.openBluetoothAdapter({
                success: () => {
                    resolve()
                },
                fail: () => {
                    reject()
                }
            })
        })
    }

    /**
     * 获取设备信息
     * @param {*} cal 
     */
    getPhoneInfo(cal) {
        if (this.phoneInfo && this.system) {
            cal()
            return
        }
        this.setPhoneInfo(cal)
    }

    /**
     * 存储手机信息
     * @param {*} cal 
     */
    setPhoneInfo(cal) {
        getPhoneInfo((res) => {
            let phoneInfo = res,
                system = res.system
            this.phoneInfo = phoneInfo
            if (system.indexOf('iOS') >= 0) {
                this.system = 'IOS'
            } else {
                this.system = 'Android'
            }
            if (cal) {
                cal()
            }

        })
    }

    /**
     * 初始化蓝牙
     */
    init() {
        // 打开蓝牙适配器
        return new Promise((resolve, reject) => {
            // 读取蓝牙状态
            wx.getBluetoothAdapterState({
                success: (res) => {
                    console.log('getBluetoothAdapterState success', res)
                    if (!res.available) {
                        reject(this.getErrorMessage('设备不可用'))
                        return
                    }
                    wx.startBluetoothDevicesDiscovery({
                        success: (res) => {
                            // success
                            console.log('startBluetoothDevicesDiscovery success', res)
                            this.searchBle(resolve, reject)
                        },
                        fail: (res) => {
                            res.errMsg = '搜索设备出错！'
                            reject(res)
                        }
                    })

                },
                fail: (res) => {
                    res.errMsg = '读取蓝牙状态失败'
                    reject(res)
                }
            })
        })
    }

    /**
     * 搜索蓝牙设备搜索
     * 初始化蓝牙搜索设备对于机型差延迟1s 调试更佳
     * @param {*} resolve 
     * @param {*} reject 
     */
    searchBle(resolve, reject) {
        setTimeout(() => {
            wx.getBluetoothDevices({
                success: (res) => {
                    console.log('搜索蓝牙', res)
                    resolve(res)
                },
                fail: (res) => {
                    res.errMsg = '搜索蓝牙出错！'
                    reject(res)
                }
            })
        }, 1000)
    }

    /**
     * 停止搜索蓝牙
     */
    stopSearchDevices() {
        wx.stopBluetoothDevicesDiscovery({
            success: function (res) {
                console.log("stopSearchDevices");
            }
        })
    }

    /**
     * 连接蓝牙
     * @param {*} deviceId 
     */
    createBLEConnection(deviceId) {
        // 连接蓝牙可以停止搜索蓝牙设备
        this.stopSearchDevices()
        return new Promise((resolve, reject) => {
            wx.createBLEConnection({
                deviceId,
                success: (res) => {
                    resolve(res)
                },
                fail: (res) => {
                    // 如果是安卓手机可能会有连接不上情况 需要增加重连机制
                    res.errMsg = "连接蓝牙错误"
                    reject(res)
                }
            })
        })
    }

    /**
     * 组装错误信息
     * @param {*} msg 
     */
    getErrorMessage(msg) {
        return {
            errMsg: msg
        }

    }
}