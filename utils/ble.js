import {
    promisic,
    getPhoneInfo
} from './util'


export default class Ble {
    constructor() {
        getPhoneInfo((res) => {
            let phoneInfo = res,
                system = res.system
            this.phoneInfo = phoneInfo
            if (system.indexOf('iOS') >= 0) {
                this.system = 'IOS'
            } else {
                this.system = 'Android'
            }

        })
    }

    openBluetoothAdapter() {
        console.log(this.phoneInfo)
        console.log(this.system)
        // return promisic(wx.openBluetoothAdapter)
    }
}