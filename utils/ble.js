import {
    promisic,
    getPhoneInfo
} from './util'

import {
    ToModbusCRC16,
    ab2hex
} from './crc16'


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
        if (this.phoneInfo) {
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
            this.version = phoneInfo.version
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
        }, 500)
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
                    this.setDeviceInfo()
                    this._deviceId = deviceId
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
     * 获取设备serviceId
     * 获取设备特征值
     * @param {*} deviceId 
     */
    setDeviceInfo(deviceId) {
        wx.getBLEDeviceServices({
            deviceId,
            success: (res) => {
                console.log('getBLEDeviceServices success', res)
                this.services = res.services
                let uuid = null
                res.services.forEach((item) => {
                    if (item.isPrimary) {
                        uuid = item.uuid
                    }
                })
                this._serviceId =  uuid
                // 获取特征UUID
                setTimeout(() => {
                    wx.getBLEDeviceCharacteristics({
                        deviceId,
                        serviceId: this.getServiceIdBySystem(uuid),
                        success: (res) => {
                            console.log('iOSGetBLEDeviceCharacteristics success', res.characteristics)
                            this.characteristics = res.characteristics
                            res.characteristics.forEach((item) => {
                                if (!!item.properties && !!item.properties.write && item.properties.write) {
                                    this._characteristicsId = item.uuid
                                }
                            })
                        },
                        fail: function (res) {
                            reject(res);
                        }
                    })
                }, 500)
            }
        })
    }

    writeBle() {
        console.log("crc16:", ToModbusCRC16('34438888020000', false))
        // 向蓝牙设备发送获取硬件信息协议
        // 34 43 88 88 02 00 00 4F 0A
        let buffer = new ArrayBuffer(9)
        let dataView = new DataView(buffer)
        // 写入协议头
        dataView.setUint8(0, 0x34)
        dataView.setUint8(1, 0x43)
        dataView.setUint8(2, 0x88)
        dataView.setUint8(3, 0x88)
        // 写入协议类型
        dataView.setUint8(4, 0x01)
        // 写入负载长度
        dataView.setUint16(5, 0x03)
        // 由于获取硬件信息不需要业务数据，所以此协议不含业务数据体
        // 写入两个字节的crc校验结果
        dataView.setUint16(7, 0xB695)

        console.log("number:", ab2hex(buffer))

        return new Promise((resolve, reject) => {
            wx.writeBLECharacteristicValue({
                deviceId: this._deviceId,
                serviceId: this.getServiceIdBySystem(this._serviceId),
                characteristicId: this._characteristicsId,
                value: buffer,
                success: (res) => {
                    resolve(res)
                },
                fail: (res) => {
                    reject(res)
                }
            })



        })
    }

    /**
     * 获取服务id
     */
    getServiceIdBySystem(id) {
        if (this.system == "IOS") {
            // return "F000FFC0-DD84-ED9C-7BFE-8121E9B75F97";
            return id.toUpperCase()
        } else { // 如果是安卓 在6.5.10版本之前服务uuid 必须大写
            if (this.versionfunegt(edition, '6.5.10')) {
                return id.toUpperCase()
            }
        }

        return id
    }

    /**
     * 版本号比较
     * @param {*} version 
     * @param {*} minVersion 
     */
    versionfunegt(version, minVersion) {
        let original = version.split('.'),
            min = minVersion.split('.')
        if (parseInt(original[0]) > parseInt(min[0])) {
            return true
        } else if (parseInt(original[1]) > parseInt(min[1])) {
            return true
        } else if (parseInt(original[2]) >= parseInt(min[2])) {
            return true
        } else {
            return false
        }
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